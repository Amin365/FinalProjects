import mongoose from "mongoose";
import Reservation from "../models/Reservation.js";
import Book from "../models/Books.js";
import Member from "../models/Members.js";
import User from "../models/user.js";
import Notification from "../models/Notification.js";

/**
 * POST /reservations
 * Create a reservation for a book (only allowed when availableCopies == 0).
 */
export const createReservation = async (req, res, next) => {
  try {
    const { book, member } = req.body;

    if (!book || !member) {
      return res.status(400).json({ message: "book and member are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(book)) {
      return res.status(400).json({ message: "Invalid book id" });
    }
    if (!mongoose.Types.ObjectId.isValid(member)) {
      return res.status(400).json({ message: "Invalid member id" });
    }

    const [bookDoc, memberDoc] = await Promise.all([
      Book.findById(book).lean().exec(),
      Member.findById(member).lean().exec(),
    ]);

    if (!bookDoc) return res.status(404).json({ message: "Book not found" });
    if (!memberDoc) return res.status(404).json({ message: "Member not found" });

    if ((bookDoc.availableCopies || 0) > 0) {
      return res.status(409).json({
        message: "Book has available copies. Please issue directly instead of reserving.",
      });
    }

    // Don't allow reservations for books permanently out of circulation
    if (["lost", "damaged", "archived"].includes(bookDoc.status)) {
      return res.status(409).json({
        message: `Cannot reserve a book with status: ${bookDoc.status}.`,
      });
    }

    // Check if member already has an active reservation for this book
    const existing = await Reservation.findOne({
      book: bookDoc._id,
      member: memberDoc._id,
      status: "Active",
    }).lean();

    if (existing) {
      return res.status(409).json({ message: "You already have an active reservation for this book." });
    }

    // Determine position in queue
    const queueLength = await Reservation.countDocuments({
      book: bookDoc._id,
      status: "Active",
    });

    const reservation = await Reservation.create({
      book: bookDoc._id,
      member: memberDoc._id,
      createdBy: req.user?._id,
      status: "Active",
    });

    // Notify the member's linked user
    try {
      const memberUser = await User.findOne({ member: memberDoc._id }).select("_id").lean();
      if (memberUser?._id) {
        await Notification.create({
          user: memberUser._id,
          title: "Reservation confirmed",
          message: `Your reservation for "${bookDoc.title}" is confirmed. Queue position: #${queueLength + 1}.`,
          type: "info",
          meta: { reservation: reservation._id, book: bookDoc._id, kind: "reservation-created" },
        });
      }
    } catch (_) {
      // Non-blocking
    }

    const populated = await Reservation.findById(reservation._id)
      .populate("book", "title author isbn status book_picture")
      .populate("member", "first_name middle_name last_name full_name email code")
      .lean();

    return res.status(201).json({ data: populated, position: queueLength + 1 });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /reservations
 * List reservations. Supports ?book=&member=&status=&page=&limit=
 */
export const getReservations = async (req, res, next) => {
  try {
    const { book, member, status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * perPage;

    const filter = {};
    if (book && mongoose.Types.ObjectId.isValid(book)) filter.book = book;
    if (member && mongoose.Types.ObjectId.isValid(member)) filter.member = member;
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      Reservation.find(filter)
        .populate("book", "title author isbn status book_picture availableCopies")
        .populate("member", "first_name middle_name last_name full_name email code")
        .populate("createdBy", "first_name last_name username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      Reservation.countDocuments(filter),
    ]);

    return res.status(200).json({
      data: items,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / perPage),
      limit: perPage,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /reservations/book/:bookId
 * Get the reservation queue for a specific book.
 */
export const getBookQueue = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid book id" });
    }

    const book = await Book.findById(bookId).lean().exec();
    if (!book) return res.status(404).json({ message: "Book not found" });

    const queue = await Reservation.find({ book: bookId, status: "Active" })
      .populate("member", "first_name middle_name last_name full_name email code")
      .sort({ createdAt: 1 }) // FIFO order
      .lean();

    // Attach position
    const queueWithPosition = queue.map((r, i) => ({ ...r, position: i + 1 }));

    return res.status(200).json({ data: queueWithPosition, total: queue.length });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /reservations/:id/cancel
 */
export const cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid reservation id" });
    }

    const reservation = await Reservation.findById(id).exec();
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    if (reservation.status !== "Active") {
      return res.status(409).json({ message: `Reservation is already ${reservation.status}` });
    }

    reservation.status = "Cancelled";
    await reservation.save();

    return res.status(200).json({ data: reservation });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /reservations/:id/fulfill
 * Admin/moderator action to mark a reservation as fulfilled.
 */
export const fulfillReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid reservation id" });
    }

    const reservation = await Reservation.findById(id)
      .populate("book", "title")
      .populate("member", "first_name last_name email")
      .exec();

    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    if (reservation.status !== "Active") {
      return res.status(409).json({ message: `Reservation is already ${reservation.status}` });
    }

    reservation.status = "Fulfilled";
    await reservation.save();

    // Notify the member
    try {
      const memberUser = await User.findOne({ member: reservation.member._id }).select("_id").lean();
      if (memberUser?._id) {
        await Notification.create({
          user: memberUser._id,
          title: "Reservation fulfilled",
          message: `Your reservation for "${reservation.book?.title}" has been fulfilled.`,
          type: "success",
          meta: { reservation: reservation._id, book: reservation.book._id, kind: "reservation-fulfilled" },
        });
      }
    } catch (_) {
      // Non-blocking
    }

    return res.status(200).json({ data: reservation });
  } catch (err) {
    return next(err);
  }
};

/**
 * Notify the next reservation in queue when a book becomes available.
 * Called internally from IssueController when a book is returned.
 */
export async function notifyNextReservation(bookId) {
  try {
    const next = await Reservation.findOne({ book: bookId, status: "Active" })
      .sort({ createdAt: 1 })
      .populate("member", "first_name last_name email")
      .populate("book", "title")
      .lean();

    if (!next) return;

    // Notify the member's linked user
    const memberUser = await User.findOne({ member: next.member._id }).select("_id").lean();
    if (memberUser?._id) {
      await Notification.create({
        user: memberUser._id,
        title: "Book available!",
        message: `Good news! "${next.book?.title}" is now available for you to pick up. Visit the library to collect your reserved copy.`,
        type: "success",
        meta: { reservation: next._id, book: next.book._id, kind: "reservation-ready" },
      });
    }

    // Update notifiedAt on the reservation
    await Reservation.findByIdAndUpdate(next._id, { notifiedAt: new Date() });
  } catch (_) {
    // Non-blocking
  }
}
