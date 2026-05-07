import Book from "../models/Books.js";
import Member from "../models/Members.js";
import Issue from "../models/Issue.js";
import Clubreq from "../models/Clubreq.js";
import Program from "../models/Program.js";
import Enrollment from "../models/Enrollment.js";

/**
 * GET /api/dashboard/stats
 * Summary KPI counts for the dashboard home page.
 */
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalBooks,
      availableBooksAgg,
      borrowedBooks,
      totalMembers,
      activeMembers,
      overdueIssues,
      pendingJoinRequests,
      totalPrograms,
    ] = await Promise.all([
      Book.countDocuments(),
      Book.aggregate([{ $group: { _id: null, total: { $sum: "$availableCopies" } } }]),
      Issue.countDocuments({ status: "Issued" }),
      Member.countDocuments(),
      Member.countDocuments({ status: "Active" }),
      Issue.countDocuments({ status: "Overdue" }),
      Clubreq.countDocuments({ status: "Pending" }),
      Program.countDocuments(),
    ]);

    res.json({
      totalBooks,
      availableBooks: availableBooksAgg[0]?.total ?? 0,
      borrowedBooks,
      totalMembers,
      activeMembers,
      overdueIssues,
      pendingJoinRequests,
      totalPrograms,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/dashboard/activity
 * Combined feed of recent meaningful events across collections.
 */
export const getRecentActivity = async (req, res) => {
  try {
    const [
      recentMembers,
      recentBooks,
      recentIssues,
      recentReturns,
      recentJoinReqs,
    ] = await Promise.all([
      Member.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("first_name last_name code createdAt"),
      Book.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title author createdAt"),
      Issue.find({ status: { $in: ["Issued", "Overdue"] } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("book", "title")
        .populate("member", "first_name last_name code"),
      Issue.find({ status: "Returned" })
        .sort({ returnedAt: -1 })
        .limit(5)
        .populate("book", "title")
        .populate("member", "first_name last_name code"),
      Clubreq.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("FullName email status createdAt"),
    ]);

    const events = [];

    recentMembers.forEach((m) =>
      events.push({
        type: "member_created",
        label: `New member: ${m.first_name} ${m.last_name}`,
        meta: { code: m.code },
        timestamp: m.createdAt,
      })
    );

    recentBooks.forEach((b) =>
      events.push({
        type: "book_created",
        label: `New book added: "${b.title}"`,
        meta: { author: b.author },
        timestamp: b.createdAt,
      })
    );

    recentIssues.forEach((i) =>
      events.push({
        type: "issue_created",
        label: `Book issued: "${i.book?.title ?? "?"}" → ${
          i.member ? `${i.member.first_name} ${i.member.last_name}` : "unknown member"
        }`,
        meta: {},
        timestamp: i.createdAt,
      })
    );

    recentReturns.forEach((i) =>
      events.push({
        type: "issue_returned",
        label: `Book returned: "${i.book?.title ?? "?"}" by ${
          i.member ? `${i.member.first_name} ${i.member.last_name}` : "unknown member"
        }`,
        meta: {},
        timestamp: i.returnedAt || i.updatedAt,
      })
    );

    recentJoinReqs.forEach((r) =>
      events.push({
        type: "join_request",
        label: `Join request from ${r.FullName}`,
        meta: { status: r.status, email: r.email },
        timestamp: r.createdAt,
      })
    );

    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(events.slice(0, 20));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/dashboard/top-readers
 * Members ranked by number of books issued.
 */
export const getTopReaders = async (req, res) => {
  try {
    const grouped = await Issue.aggregate([
      {
        $match: {
          member: { $ne: null },
        },
      },
      { $group: { _id: "$member", issueCount: { $sum: 1 } } },
      { $sort: { issueCount: -1 } },
      { $limit: 10 },
    ]);

    const memberIds = grouped.map((entry) => entry._id).filter(Boolean);
    const members = await Member.find({ _id: { $in: memberIds } }).select("first_name last_name code").lean();
    const memberMap = new Map(members.map((m) => [String(m._id), m]));

    const result = grouped.map((entry) => {
      const member = memberMap.get(String(entry._id));
      return {
        _id: entry._id,
        issueCount: entry.issueCount,
        member: member
          ? {
              first_name: member.first_name,
              last_name: member.last_name,
              code: member.code,
            }
          : null,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/dashboard/popular-books
 * Books ranked by total number of issues.
 */
export const getPopularBooks = async (req, res) => {
  try {
    const grouped = await Issue.aggregate([
      { $group: { _id: "$book", issueCount: { $sum: 1 } } },
      { $sort: { issueCount: -1 } },
      { $limit: 10 },
    ]);

    const enriched = await Promise.all(
      grouped.map(async (entry) => {
        const book = await Book.findById(entry._id).select(
          "title author availableCopies totalCopies book_picture"
        );

        return {
          _id: entry._id,
          issueCount: entry.issueCount,
          title: book?.title ?? "Unknown",
          author: book?.author ?? null,
          availableCopies: book?.availableCopies ?? 0,
          totalCopies: book?.totalCopies ?? 0,
          cover: book?.book_picture ?? null,
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/dashboard/pending-approvals
 * Lists of items that require admin action.
 */
export const getPendingApprovals = async (req, res) => {
  try {
    const [pendingJoinRequests, overdueIssues] = await Promise.all([
      Clubreq.find({ status: "Pending" })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("FullName email phone createdAt"),
      Issue.find({ status: "Overdue" })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("book", "title author")
        .populate("member", "first_name last_name code"),
    ]);

    res.json({
      pendingJoinRequests,
      overdueIssues,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/dashboard/top-programs
 * Programmes ranked by total enrollments.
 */
export const getTopPrograms = async (req, res) => {
  try {
    const grouped = await Enrollment.aggregate([
      { $match: { status: { $nin: ["cancelled", "rejected"] } } },
      { $group: { _id: "$programId", enrollmentCount: { $sum: 1 } } },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 10 },
    ]);

    const programIds = grouped.map((entry) => entry._id).filter(Boolean);
    const programs = await Program.find({ _id: { $in: programIds } })
      .select("title teacherId status capacity")
      .lean();
    const programMap = new Map(programs.map((program) => [String(program._id), program]));

    const result = grouped.map((entry) => {
      const program = programMap.get(String(entry._id));
      return {
        _id: entry._id,
        title: program?.title || "Unknown programme",
        status: program?.status || "",
        capacity: program?.capacity ?? null,
        enrollmentCount: entry.enrollmentCount,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
