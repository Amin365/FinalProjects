import mongoose from "mongoose";
import Book from "../models/Books.js";
import Issue from "../models/Issue.js";
import { logBookAction, buildChanges } from "../utility/auditLog.js";

/**
 * Helper: escape user input for use in a RegExp
 */
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Create a new book
 */
export const createBook = async (req, res, next) => {
  try {
    const { title, author, BookType, isbn, status, book_picture, totalPages, totalCopies, availableCopies } = req.body;

    // Basic validation (consider replacing with express-validator/Joi)
    if (!title || !BookType) {
      return res.status(400).json({ message: "title and BookType are required" });
    }

    const uploaded=req.file
    const imageUrl =
      (uploaded && (uploaded.path || uploaded.secure_url || uploaded.url)) || null;



    // Build model instance and save
    // normalize total/available copies
    // If totalCopies was not provided but availableCopies was, assume totalCopies == availableCopies
    let tc;
    if (typeof totalCopies !== "undefined" && totalCopies !== null && totalCopies !== "") {
      tc = Number(totalCopies) || 1;
    } else if (typeof availableCopies !== "undefined" && availableCopies !== null && availableCopies !== "") {
      tc = Number(availableCopies) || 1;
    } else {
      tc = 1;
    }

    const av = typeof availableCopies !== "undefined" ? Number(availableCopies) : tc;

    const book = new Book({
      title,
      author,
      BookType,
      isbn,
      status,
      book_picture: imageUrl,
      totalPages,
      totalCopies: tc,
      availableCopies: Math.max(0, Math.min(av, tc)),
    });

    try {
      const saved = await book.save();
      
      // Phase 8: Audit log
      await logBookAction("created", saved, req.user, req, {
        description: `Book "${saved.title}" was created`,
      });
      
      return res.status(201).json(saved);
    } catch (err) {
      // Duplicate key (e.g., ISBN unique constraint)
      if (err && err.code === 11000) {
        const dupField = Object.keys(err.keyValue || {}).join(", ") || "unique field";
        return res.status(409).json({
          message: `Duplicate ${dupField}: a book with this value already exists.`,
          details: err.keyValue || null,
        });
      }
      return next(err);
    }
  } catch (err) {
    return next(err);
  }
};

/**
 * Get books with pagination, filtering, sorting.
 * Usage: GET /books?page=1&limit=20&sort=-createdAt&q=search&author=...&BookType=...&status=...&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns: { data, total, page, limit, totalPages }
 */
export const getBooks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = "-createdAt",
      q,
      isbn,
      author,
      BookType,
      status,
      from,
      to,
    } = req.query;

    const filter = {};

    if (isbn) {
      filter.isbn = String(isbn).trim();
    }

    if (q) {
      // safe regex search across title, author, isbn
      const re = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ title: re }, { author: re }, { isbn: re }];
    }

    if (author) filter.author = author;
    if (BookType) filter.BookType = BookType;
    if (status) filter.status = status;

    if (from || to) {
      filter.publishedDate = {};
      if (from) {
        const d = new Date(from);
        if (!Number.isNaN(d.getTime())) filter.publishedDate.$gte = d;
      }
      if (to) {
        const d = new Date(to);
        if (!Number.isNaN(d.getTime())) filter.publishedDate.$lte = d;
      }
      if (Object.keys(filter.publishedDate).length === 0) delete filter.publishedDate;
    }

    // sanitize and bound paging params
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * perPage;

    // NOTE: sort comes from user query. For safety you may want to validate allowed sort fields.
    const [items, total] = await Promise.all([
      Book.find(filter).sort(sort).skip(skip).limit(perPage).lean().exec(),
      Book.countDocuments(filter).exec(),
    ]);

    // attach borrowedCount per book (number of active Issued issues)
    const bookIds = items.map((b) => b._id).filter(Boolean);
    if (bookIds.length > 0) {
      const counts = await Issue.aggregate([
        { $match: { book: { $in: bookIds.map((id) => new mongoose.Types.ObjectId(id)) }, status: "Issued" } },
        { $group: { _id: "$book", count: { $sum: 1 } } },
      ]).exec();
      const map = counts.reduce((acc, c) => ({ ...acc, [String(c._id)]: c.count }), {});
      for (const it of items) {
        it.borrowedCount = map[String(it._id)] || 0;
      }
    }

    // Return shape: { data, total, page, limit, totalPages }
    return res.status(200).json({
      data: items,
      total,
      page: pageNum,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (err) {
    return next(err);
  }
};
export const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;

   
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book id" });
    }

    const book = await Book.findById(id).lean().exec();

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    return res.status(200).json({ data: book });
  } catch (err) {
    return next(err);
  }
};



/**
 * Update a book by id
 * PUT /books/:id
 * Body: partial or full book fields
 */
export const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book id" });
    }

    const update = { ...req.body };
    // Prevent accidental _id changes
    if (update._id) delete update._id;

    try {
      // If update contains copies, normalize availableCopies to not exceed totalCopies
      if (Object.prototype.hasOwnProperty.call(update, "totalCopies")) {
        update.totalCopies = Number(update.totalCopies) || 0;
      }
      if (Object.prototype.hasOwnProperty.call(update, "availableCopies")) {
        update.availableCopies = Number(update.availableCopies) || 0;
      }

      const updated = await Book.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
        context: "query",
      }).exec();

        if (req.file) {
      const uploaded = req.file;
      update.book_picture = uploaded.path || uploaded.secure_url || uploaded.url;
    }

      // ensure availableCopies never exceeds totalCopies
      if (updated) {
        const tc = Number(updated.totalCopies) || 0;
        const av = Number(updated.availableCopies) || 0;
        if (tc > 0 && av > tc) {
          updated.availableCopies = tc;
          await updated.save();
        }
      }
      const updatedLean = updated ? (await Book.findById(updated._id).lean().exec()) : null;

      if (!updated) {
        return res.status(404).json({ message: "Book not found" });
      }

      return res.status(200).json(updated);
    } catch (err) {
      if (err && err.code === 11000) {
        const dupField = Object.keys(err.keyValue || {}).join(", ") || "unique field";
        return res.status(409).json({
          message: `Duplicate ${dupField}: a book with this value already exists.`,
          details: err.keyValue || null,
        });
      }
      return next(err);
    }
  } catch (err) {
    return next(err);
  }
};

/**
 * Delete a book by id
 * DELETE /books/:id
 */
export const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book id" });
    }

    const removed = await Book.findByIdAndDelete(id).lean().exec();
    if (!removed) {
      return res.status(404).json({ message: "Book not found" });
    }

    return res.status(200).json({ message: "Book deleted", id: removed._id });
  } catch (err) {
    return next(err);
  }
};


const normalize = (v) => (v == null ? "" : String(v).trim());

const toIntOr = (v, fallback) => {
  if (v === "" || v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

const allowedStatus = new Set(["available", "borrowed", "lost", "damaged", "archived"]);

/**
 * POST /books/bulk
 * Body: { books: [...] }
 *
 * Required from file: title
 * isbn is OPTIONAL (auto-generated by schema pre('validate') hook if missing)
 *
 * Behavior:
 * - invalid rows => skipped + added to errors[]
 * - duplicates by provided isbn => skipped
 * - existing isbn in DB => skipped
 * - rows without isbn are inserted (isbn generated)
 */
export const bulkCreateBooks = async (req, res, next) => {
  try {
    const { books } = req.body;

    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ message: "books must be a non-empty array" });
    }

    const prepared = [];
    const errors = [];

    for (let i = 0; i < books.length; i++) {
      const raw = books[i] || {};

      const title = normalize(raw.title);
      if (!title) {
        errors.push({ index: i, message: "title is required" });
        continue;
      }

      // optional fields
      const author = normalize(raw.author);
      const BookType = normalize(raw.BookType);
      const book_picture = normalize(raw.book_picture);

      const statusRaw = normalize(raw.status).toLowerCase();
      const status = statusRaw || "available";
      if (status && !allowedStatus.has(status)) {
        errors.push({ index: i, message: `Invalid status: ${status}` });
        continue;
      }

      const totalPages = toIntOr(raw.totalPages, 0);
      const totalCopies = toIntOr(raw.totalCopies, 1);

      // if not provided, default availableCopies = totalCopies (better import UX)
      const availableCopies =
        raw.availableCopies == null || raw.availableCopies === ""
          ? totalCopies
          : toIntOr(raw.availableCopies, totalCopies);

      if (totalPages < 0) {
        errors.push({ index: i, message: "totalPages must be >= 0" });
        continue;
      }
      if (totalCopies < 0) {
        errors.push({ index: i, message: "totalCopies must be >= 0" });
        continue;
      }
      if (availableCopies < 0) {
        errors.push({ index: i, message: "availableCopies must be >= 0" });
        continue;
      }
      if (availableCopies > totalCopies) {
        errors.push({ index: i, message: "availableCopies cannot be greater than totalCopies" });
        continue;
      }

      // isbn is OPTIONAL (auto-generated if missing)
      const isbn = normalize(raw.isbn);

      const doc = {
        title,
        author: author || undefined,
        BookType: BookType || undefined,
        status,
        book_picture: book_picture || undefined,
        totalPages,
        totalCopies,
        availableCopies,
      };

      // if provided, keep it; if missing, schema hook generates it
      if (isbn) doc.isbn = isbn;

      prepared.push(doc);
    }

    // 1) Deduplicate inside the file by provided isbn ONLY
    const seenIsbn = new Set();
    const deduped = [];
    for (const doc of prepared) {
      if (doc.isbn) {
        const key = doc.isbn.toLowerCase();
        if (seenIsbn.has(key)) continue;
        seenIsbn.add(key);
      }
      deduped.push(doc);
    }

    // 2) Skip rows whose provided isbn already exists in DB
    const providedIsbns = deduped.map((d) => d.isbn).filter(Boolean);
    const existing = providedIsbns.length
      ? await Book.find({ isbn: { $in: providedIsbns } }).select("isbn").lean().exec()
      : [];

    const existingIsbns = new Set(existing.map((x) => String(x.isbn || "").toLowerCase()).filter(Boolean));

    const toInsert = [];
    let skippedCount = 0;

    for (const doc of deduped) {
      if (doc.isbn) {
        const key = doc.isbn.toLowerCase();
        if (existingIsbns.has(key)) {
          skippedCount++;
          continue;
        }
      }
      toInsert.push(doc);
    }

    if (toInsert.length === 0) {
      return res.status(200).json({
        message: "No new books inserted (all duplicates or invalid).",
        insertedCount: 0,
        skippedCount,
        errorCount: errors.length,
        errors,
      });
    }

    // Insert
    // If some insert fails because of duplicate key (race condition), ordered:false continues.
    const inserted = await Book.insertMany(toInsert, { ordered: false });

    return res.status(201).json({
      message: "Bulk books import complete.",
      insertedCount: inserted.length,
      skippedCount,
      errorCount: errors.length,
      errors,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        message: "Some records already exist (duplicate isbn).",
        details: err?.keyValue,
      });
    }
    return next(err);
  }
};


export default {
  createBook,
  getBooks,
  updateBook,
  deleteBook,
};

/**
 * PATCH /books/:id/condition
 * Body: { status: 'lost' | 'damaged' | 'archived' | 'available', note }
 * Updates the book's condition/status.
 */
export const updateBookCondition = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book id" });
    }

    const allowed = new Set(["available", "borrowed", "lost", "damaged", "archived"]);
    const { status } = req.body;

    if (!status || !allowed.has(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${[...allowed].join(", ")}`,
      });
    }

    const book = await Book.findById(id).exec();
    if (!book) return res.status(404).json({ message: "Book not found" });

    // If marking as lost/damaged/archived, adjust available copies
    if (["lost", "damaged", "archived"].includes(status)) {
      // Reset available copies to 0 when book is out of circulation
      book.availableCopies = 0;
    } else if (status === "available" && ["lost", "damaged", "archived"].includes(book.status)) {
      // Restore available copies: set to totalCopies minus currently issued copies
      const issuedCount = await (await import("../models/Issue.js")).default.countDocuments({
        book: book._id,
        status: "Issued",
      });
      book.availableCopies = Math.max(0, (book.totalCopies || 1) - issuedCount);
    }

    book.status = status;
    await book.save();

    return res.status(200).json({ data: book });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /books/:id/history
 * Returns issue history for a book.
 */
export const getBookHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book id" });
    }

    const book = await Book.findById(id).lean().exec();
    if (!book) return res.status(404).json({ message: "Book not found" });

    const issues = await Issue.find({ book: id })
      .populate("member", "first_name middle_name last_name full_name email code")
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const total = issues.length;
    const lastIssued = issues.find((i) => i.issueDate)?.issueDate ?? null;
    const lastReturned = issues.find((i) => i.returnedAt)?.returnedAt ?? null;

    return res.status(200).json({
      data: issues,
      total,
      last_issued: lastIssued,
      last_returned: lastReturned,
    });
  } catch (err) {
    return next(err);
  }
};