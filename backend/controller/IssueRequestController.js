import mongoose from "mongoose";
import IssueRequest from "../models/IssueRequest.js";
import Issue from "../models/Issue.js";
import Book from "../models/Books.js";
import Member from "../models/Members.js";
import User from "../models/user.js";
import Notification from "../models/Notification.js";
import { checkBorrowingRules, MAX_BORROW_DAYS } from "../utility/borrowingRules.js";

const populateFields = (q) =>
  q
    .populate("book", "title author isbn status book_picture availableCopies")
    .populate("member", "first_name middle_name last_name full_name email code")
    .populate("requestedBy", "first_name last_name username")
    .populate("reviewedBy", "first_name last_name username");

/**
 * POST /issue-requests
 * Member or admin creates a borrow request.
 */
export const createIssueRequest = async (req, res, next) => {
  try {
    const { book, member, requestedDays = 7, note } = req.body;

    if (!book || !member) {
      return res.status(400).json({ message: "book and member are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(book)) {
      return res.status(400).json({ message: "Invalid book id" });
    }
    if (!mongoose.Types.ObjectId.isValid(member)) {
      return res.status(400).json({ message: "Invalid member id" });
    }

    const days = Math.min(Math.max(1, parseInt(requestedDays, 10) || 7), MAX_BORROW_DAYS);

    const [bookDoc, memberDoc] = await Promise.all([
      Book.findById(book).lean().exec(),
      Member.findById(member).lean().exec(),
    ]);

    if (!bookDoc) return res.status(404).json({ message: "Book not found" });
    if (!memberDoc) return res.status(404).json({ message: "Member not found" });

    const { allowed, reason } = await checkBorrowingRules(memberDoc._id);
    if (!allowed) {
      return res.status(409).json({ message: reason });
    }

    const duplicate = await IssueRequest.findOne({
      book: bookDoc._id,
      member: memberDoc._id,
      status: "Requested",
    }).lean();

    if (duplicate) {
      return res.status(409).json({ message: "You already have a pending request for this book." });
    }

    const request = await IssueRequest.create({
      book: bookDoc._id,
      member: memberDoc._id,
      requestedBy: req.user?._id,
      status: "Requested",
      requestedDays: days,
      note: note || undefined,
    });

    const populated = await populateFields(IssueRequest.findById(request._id)).lean();

    // Notify super admins about the new request
    try {
      const admins = await User.find({}).populate("role", "role").select("_id role").lean();
      const superAdmins = admins.filter((u) => {
        const r = (u.role?.role || "").toLowerCase();
        return r.includes("super");
      });

      await Promise.all(
        superAdmins.map((admin) =>
          Notification.create({
            user: admin._id,
            title: "New book request",
            message: `${memberDoc.first_name} ${memberDoc.last_name} requested "${bookDoc.title}".`,
            type: "info",
            meta: { request: request._id, book: bookDoc._id, member: memberDoc._id, kind: "request-created" },
          })
        )
      );
    } catch (_) {}

    return res.status(201).json({ data: populated });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /issue-requests
 * List requests with role-based scoping (super admin = all, others = own member only).
 */
export const getIssueRequests = async (req, res, next) => {
  try {
    const { status, book, member, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * perPage;

    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const currentUser = await User.findById(req.user._id)
      .populate("role", "role plural")
      .select("member role")
      .lean();

    if (!currentUser) return res.status(401).json({ message: "Unauthorized" });

    const roleName = (currentUser.role?.role || currentUser.role?.plural || "").toLowerCase();
    const isSuperAdmin = roleName.includes("super");

    const filter = {};
    if (status) filter.status = status;
    if (book && mongoose.Types.ObjectId.isValid(book)) filter.book = book;

    if (isSuperAdmin) {
      if (member && mongoose.Types.ObjectId.isValid(member)) filter.member = member;
    } else {
      if (!mongoose.Types.ObjectId.isValid(currentUser.member)) {
        return res.status(200).json({ data: [], total: 0, page: pageNum, totalPages: 0, limit: perPage });
      }
      filter.member = currentUser.member;
    }

    const [items, total] = await Promise.all([
      populateFields(IssueRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(perPage)).lean(),
      IssueRequest.countDocuments(filter),
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
 * PATCH /issue-requests/:id/approve
 * Admin approves a request.
 */
export const approveIssueRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewNote } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    const request = await IssueRequest.findById(id)
      .populate("book", "title availableCopies")
      .populate("member", "first_name last_name email")
      .exec();

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "Requested") {
      return res.status(409).json({ message: `Request is already ${request.status}` });
    }

    request.status = "Approved";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    if (reviewNote) request.reviewNote = reviewNote;
    await request.save();

    try {
      const memberUser = await User.findOne({ member: request.member._id }).select("_id").lean();
      if (memberUser?._id) {
        await Notification.create({
          user: memberUser._id,
          title: "Request approved",
          message: `Your request for "${request.book?.title}" has been approved. Visit the library to collect.`,
          type: "success",
          meta: { request: request._id, book: request.book._id, kind: "request-approved" },
        });
      }
    } catch (_) {}

    const populated = await populateFields(IssueRequest.findById(request._id)).lean();
    return res.status(200).json({ data: populated });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /issue-requests/:id/reject
 * Admin rejects a request.
 */
export const rejectIssueRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewNote } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    const request = await IssueRequest.findById(id)
      .populate("book", "title")
      .populate("member", "first_name last_name email")
      .exec();

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "Requested") {
      return res.status(409).json({ message: `Request is already ${request.status}` });
    }

    request.status = "Rejected";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    if (reviewNote) request.reviewNote = reviewNote;
    await request.save();

    try {
      const memberUser = await User.findOne({ member: request.member._id }).select("_id").lean();
      if (memberUser?._id) {
        await Notification.create({
          user: memberUser._id,
          title: "Request rejected",
          message: `Your request for "${request.book?.title}" was not approved.${reviewNote ? ` Reason: ${reviewNote}` : ""}`,
          type: "warning",
          meta: { request: request._id, book: request.book._id, kind: "request-rejected" },
        });
      }
    } catch (_) {}

    const populated = await populateFields(IssueRequest.findById(request._id)).lean();
    return res.status(200).json({ data: populated });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /issue-requests/:id/cancel
 * Member cancels their own request.
 */
export const cancelIssueRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    const request = await IssueRequest.findById(id).exec();
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (!["Requested", "Approved"].includes(request.status)) {
      return res.status(409).json({ message: `Cannot cancel a request with status: ${request.status}` });
    }

    request.status = "Cancelled";
    await request.save();

    const populated = await populateFields(IssueRequest.findById(request._id)).lean();
    return res.status(200).json({ data: populated });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /issue-requests/:id/issue
 * Admin converts an approved request into an actual issue.
 */
export const convertToIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { issueDate, returnDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    if (!issueDate || !returnDate) {
      return res.status(400).json({ message: "issueDate and returnDate are required" });
    }

    const request = await IssueRequest.findById(id).populate("book").populate("member").exec();
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.status !== "Approved") {
      return res.status(409).json({ message: "Only approved requests can be converted to issues." });
    }

    const issueDt = new Date(issueDate);
    const returnDt = new Date(returnDate);
    const diffDays = Math.round((returnDt - issueDt) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return res.status(400).json({ message: "Return date must be after issue date" });
    }
    if (diffDays > MAX_BORROW_DAYS) {
      return res.status(400).json({ message: `Return date must be within ${MAX_BORROW_DAYS} days` });
    }

    const { allowed, reason } = await checkBorrowingRules(request.member._id);
    if (!allowed) {
      return res.status(409).json({ message: `Cannot issue: ${reason}` });
    }

    const updatedBook = await Book.findOneAndUpdate(
      { _id: request.book._id, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    ).exec();

    if (!updatedBook) {
      return res.status(409).json({ message: "No available copies for this book" });
    }

    updatedBook.status = (updatedBook.availableCopies || 0) <= 0 ? "borrowed" : "available";
    await updatedBook.save();

    const issue = await Issue.create({
      book: request.book._id,
      member: request.member._id,
      issueDate: issueDt,
      returnDate: returnDt,
      status: "Issued",
    });

    request.status = "Issued";
    request.issueId = issue._id;
    await request.save();

    try {
      const memberUser = await User.findOne({ member: request.member._id }).select("_id").lean();
      if (memberUser?._id) {
        await Notification.create({
          user: memberUser._id,
          title: "Book issued",
          message: `"${request.book?.title}" has been issued to you. Due on ${returnDt.toLocaleDateString()}.`,
          type: "success",
          meta: { issue: issue._id, request: request._id, kind: "issued" },
        });
      }
    } catch (_) {}

    const populatedIssue = await Issue.findById(issue._id)
      .populate("book", "title author isbn status book_picture")
      .populate("member", "first_name middle_name last_name full_name email code")
      .lean();

    return res.status(201).json({ data: populatedIssue });
  } catch (err) {
    return next(err);
  }
};