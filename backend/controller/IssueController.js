import mongoose from "mongoose";
import Issue from "../models/Issue.js";
import Book from "../models/Books.js"; // file name Books.js, model name expected as Book
import Member from "../models/Members.js";
import User from "../models/user.js";
import Notification from "../models/Notification.js";
import { sendMail, buildEmailHtml } from "../controller/EmailController.js";
import { sendPushToUser } from "../utility/push.js";
import { checkBorrowingRules } from "../utility/borrowingRules.js";
import { notifyNextReservation } from "../controller/ReservationController.js";
import { logIssueAction } from "../utility/auditLog.js";

export const IssueCreate = async (req, res, next) => {
  try {
    const { book, member, issueDate, returnDate } = req.body;

    if (!book || !member || !issueDate || !returnDate) {
      return res.status(400).json({ message: "book, member, issueDate and returnDate are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(book)) {
      return res.status(400).json({ message: "Invalid book id" });
    }
    if (!mongoose.Types.ObjectId.isValid(member)) {
      return res.status(400).json({ message: "Invalid member id" });
    }

    const [bookDoc, memberDoc] = await Promise.all([
      Book.findById(book).exec(),
      Member.findById(member).exec(),
    ]);

    if (!memberDoc) {
      return res.status(404).json({ message: "Member not found. Before requesting a book you must be member of the Club" });
    }
    if (!bookDoc) return res.status(404).json({ message: "Book not found" });

    // Check borrowing rules
    const { allowed, reason } = await checkBorrowingRules(memberDoc._id);
    if (!allowed) {
      return res.status(409).json({ message: reason });
    }

    // Ensure there are available copies and atomically decrement
    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookDoc._id, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    ).exec();

    if (!updatedBook) {
      return res.status(409).json({ message: "No available copies for this book" });
    }

    // Update status based on availability
    updatedBook.status = (updatedBook.availableCopies || 0) <= 0 ? "borrowed" : "available";
    await updatedBook.save();

    const issue = await Issue.create({
      book: updatedBook._id,
      member: memberDoc._id,
      issueDate: new Date(issueDate),
      returnDate: new Date(returnDate),
      status: "Issued",
    });

    const populated = await Issue.findById(issue._id)
      .populate("book", "title author isbn status book_picture")
      .populate("member", "first_name middle_name last_name full_name email code")
      .lean()
      .exec();

    await logIssueAction("created", populated, req.user, req, {
      description: `Book "${bookDoc.title}" issued to "${memberDoc.first_name} ${memberDoc.last_name}"`,
    });

    // Notify member's linked user
    try {
      const memberUser = await User.findOne({ member: memberDoc._id }).select("_id").lean();
      if (memberUser?._id) {
        await Notification.create({
          user: memberUser._id,
          title: "Book issued",
          message: `${bookDoc.title} has been issued to you. Due on ${new Date(returnDate).toLocaleDateString()}.`,
          type: "success",
          meta: { issue: issue._id, kind: "issued" },
        });
      }
    } catch (_) {}

    return res.status(201).json({ data: populated });
  } catch (err) {
    return next(err);
  }
};

export const getIssues = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, q, status } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const perPage = Math.min(500, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * perPage;

    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const currentUser = await User.findById(req.user._id)
      .populate("role", "role plural")
      .select("member role")
      .lean();

    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const roleName = (currentUser.role?.role || currentUser.role?.plural || "").toLowerCase();
    const isSuperAdmin = roleName.includes("super");

    // Base filter
    const filter = {
      book: { $type: "objectId" },
      member: { $type: "objectId" },
    };

    if (status) filter.status = status;

    // Scope:
    // - super admin: all
    // - others: only own member issues
    if (!isSuperAdmin) {
      if (!mongoose.Types.ObjectId.isValid(currentUser.member)) {
        return res.status(200).json({
          data: [],
          total: 0,
          page: pageNum,
          totalPages: 0,
          limit: perPage,
        });
      }
      filter.member = currentUser.member;
    }

    // Search by member code
    if (q) {
      const re = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

      const members = await Member.find({ code: re }).select("_id").lean();
      const memberIds = members.map((m) => m._id).filter((id) => mongoose.Types.ObjectId.isValid(id));

      if (memberIds.length > 0) {
        if (filter.member && !filter.member.$in) {
          // own-scope mode
          if (!memberIds.some((id) => String(id) === String(filter.member))) {
            return res.status(200).json({
              data: [],
              total: 0,
              page: pageNum,
              totalPages: 0,
              limit: perPage,
            });
          }
        } else {
          filter.member = { $in: memberIds };
        }
      } else {
        return res.status(200).json({
          data: [],
          total: 0,
          page: pageNum,
          totalPages: 0,
          limit: perPage,
        });
      }
    }

    const [items, total] = await Promise.all([
      Issue.find(filter)
        .populate("book", "title author isbn status book_picture availableCopies")
        .populate("member", "first_name middle_name last_name full_name email code")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      Issue.countDocuments(filter),
    ]);

    const bookIds = items.map((i) => i.book?._id).filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (bookIds.length > 0) {
      const counts = await Issue.aggregate([
        { $match: { book: { $in: bookIds }, status: "Issued" } },
        { $group: { _id: "$book", count: { $sum: 1 } } },
      ]);

      const countMap = {};
      counts.forEach((c) => {
        countMap[String(c._id)] = c.count;
      });

      items.forEach((i) => {
        if (i.book) i.book.borrowedCount = countMap[String(i.book._id)] || 0;
      });
    }

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

export const markIssueReturned = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid issue id" });
    }

    const issue = await Issue.findById(id).exec();
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    if (issue.status === "Returned") {
      return res.status(409).json({ message: "Issue already returned" });
    }

    issue.status = "Returned";
    issue.returnedAt = new Date();
    await issue.save();

    let bookDoc = await Book.findByIdAndUpdate(
      issue.book,
      { $inc: { availableCopies: 1 } },
      { new: true }
    ).exec();

    if (bookDoc) {
      const tc = Number(bookDoc.totalCopies) || 0;
      if (tc > 0 && (bookDoc.availableCopies || 0) > tc) {
        bookDoc.availableCopies = tc;
      }
      if ((bookDoc.availableCopies || 0) > 0) {
        bookDoc.status = "available";
      }
      await bookDoc.save();
      bookDoc = await Book.findById(issue.book).lean().exec();
    }

    const populated = await Issue.findById(issue._id)
      .populate("book", "title author isbn status book_picture")
      .populate("member", "first_name middle_name last_name full_name email code")
      .lean()
      .exec();

    await logIssueAction("returned", populated, req.user, req, {
      description: `Book "${bookDoc?.title || "Unknown"}" was returned`,
    });

    try {
      const memberUser = await User.findOne({ member: issue.member }).select("_id").lean();
      if (memberUser?._id) {
        await Notification.create({
          user: memberUser._id,
          title: "Book returned",
          message: `Thank you for returning "${bookDoc?.title || "your book"}".`,
          type: "success",
          meta: { issue: issue._id, kind: "returned" },
        });
      }
    } catch (_) {}

    await notifyNextReservation(issue.book);

    return res.status(200).json({ data: populated });
  } catch (err) {
    return next(err);
  }
};

export const getMyIssues = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("member").lean().exec();
    if (!user?.member) return res.status(400).json({ message: "User is not linked to a member" });

    const issues = await Issue.find({ member: user.member })
      .populate("book", "title author isbn status totalPages book_picture")
      .sort("-createdAt")
      .lean()
      .exec();

    return res.status(200).json({ data: issues });
  } catch (err) {
    return next(err);
  }
};

export const ReminderEmail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid issue id" });
    }

    const issue = await Issue.findById(id).populate("member").populate("book").lean();

    if (!issue) return res.status(404).json({ message: "Issue not found" });
    if (issue.status === "Returned") return res.status(400).json({ message: "Book already returned" });

    const memberUser = issue.member;
    if (!memberUser?._id) return res.status(400).json({ message: "Member not found" });

    const memberName = `${memberUser.first_name || "Member"} ${memberUser.last_name || ""}`.trim();
    const bookTitle = issue.book?.title || "the book";

    await sendPushToUser(memberUser._id, {
      title: "📕 Book Return Reminder",
      body: `"${bookTitle}" is still not returned.`,
      icon: "/jjuclub.png",
      data: { issueId: issue._id, url: "/my-books" },
    });

    await sendMail({
      to: memberUser.email,
      subject: "📕 Book Return Reminder",
      text: `Dear ${memberName}, your borrowed book "${bookTitle}" is still not returned. Please return it as soon as possible or contact the club if you need more time.`,
      html: buildEmailHtml({
        title: "Book Return Reminder",
        preheader: `Reminder: "${bookTitle}" is due.`,
        greeting: `Dear ${memberName}`,
        bodyLines: [
          `This is a friendly reminder that the book <strong>"${bookTitle}"</strong> has not yet been returned.`,
          "Please return it as soon as possible. If you need additional time, reply to this email and we will help you.",
          "Keeping returns on time helps everyone enjoy the collection—thank you for your cooperation.",
        ],
        ctaLabel: "View My Books",
        ctaUrl: process.env.APP_URL || "#",
        footerNote: `Best regards, ${process.env.APP_NAME || "Reading Club"}`,
      }),
    });

    return res.status(200).json({ message: "Reminder sent via email and push if subscribed" });
  } catch (err) {
    console.error("ReminderEmail error:", err);
    return res.status(500).json({ message: err.message || "Failed to send reminder" });
  }
};