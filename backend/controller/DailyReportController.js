import DailyReport from "../models/DailyReport.js";
import DailyReportStreakRestore from "../models/DailyReportStreakRestore.js";
import Issue from "../models/Issue.js";

function toISODateOnly(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function startOfUTCDay(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function endOfUTCDay(date) {
  const start = startOfUTCDay(date);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);
  return end;
}

function monthKeyUTC(date = new Date()) {
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

async function assertBookIssuedToMember(user, bookId) {
  const memberId = user?.member?._id || user?.member;
  if (!memberId) return false;

  const hasIssue = await Issue.exists({
    member: memberId,
    book: bookId,
    status: { $in: ["Issued", "Overdue"] },
  });

  return Boolean(hasIssue);
}

export const getMyDailyReports = async (req, res) => {
  try {
    const { book, limit = 100 } = req.query;
    if (!book) return res.status(400).json({ message: "book is required" });

    const lim = Math.max(1, Math.min(200, Number(limit) || 100));

    const reports = await DailyReport.find({
      createdBy: req.user._id,
      book,
    })
      .sort({ readingDate: -1, createdAt: -1 })
      .limit(lim)
      .lean();

    return res.json({ data: reports });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createDailyReport = async (req, res) => {
  try {
    const { book, readingDate, pagesFrom, pagesTo, timeSpent, summary, rating } = req.body || {};

    if (!book || !readingDate || pagesFrom === undefined || pagesTo === undefined || timeSpent === undefined || !summary || !rating) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const allowed = await assertBookIssuedToMember(req.user, book);
    if (!allowed) {
      return res.status(403).json({ message: "You can only report on books issued to you." });
    }

    const rd = new Date(readingDate);
    if (Number.isNaN(rd.getTime())) {
      return res.status(400).json({ message: "Invalid readingDate" });
    }

    // Enforce date to be today or yesterday in UTC
    const todayISO = toISODateOnly(new Date());
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayISO = toISODateOnly(yesterday);
    const readingISO = toISODateOnly(rd);

    if (readingISO !== todayISO && readingISO !== yesterdayISO) {
      return res.status(400).json({
        message: `Allowed dates: ${yesterdayISO} and ${todayISO}`,
      });
    }

    const pf = Number(pagesFrom);
    const pt = Number(pagesTo);
    const ts = Number(timeSpent);
    const rt = Number(rating);

    if (Number.isNaN(pf) || Number.isNaN(pt) || pt <= pf) {
      return res.status(400).json({ message: "pagesTo must be greater than pagesFrom" });
    }
    if (Number.isNaN(ts) || ts <= 0) {
      return res.status(400).json({ message: "timeSpent must be a positive number" });
    }
    if (Number.isNaN(rt) || rt < 1 || rt > 5) {
      return res.status(400).json({ message: "rating must be between 1 and 5" });
    }

    // Enforce sequential pagesFrom
    const last = await DailyReport.findOne({ createdBy: req.user._id, book })
      .sort({ readingDate: -1, createdAt: -1 })
      .select("pagesTo")
      .lean();
    const expectedFrom = last?.pagesTo ? Number(last.pagesTo) + 1 : 1;
    if (pf !== expectedFrom) {
      return res.status(400).json({ message: `pagesFrom must be ${expectedFrom}` });
    }

    // Prevent duplicate report same day for same book
    const dupe = await DailyReport.exists({
      createdBy: req.user._id,
      book,
      readingDate: { $gte: startOfUTCDay(rd), $lte: endOfUTCDay(rd) },
    });
    if (dupe) {
      return res.status(409).json({ message: "You already submitted a report for this book on that date" });
    }

    const created = await DailyReport.create({
      book,
      createdBy: req.user._id,
      readingDate: rd,
      pagesFrom: pf,
      pagesTo: pt,
      timeSpent: ts,
      summary: String(summary).trim(),
      rating: rt,
      status: "Pending",
    });

    return res.status(201).json({ data: created });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyStreakRestore = async (req, res) => {
  try {
    const key = monthKeyUTC();
    const doc = await DailyReportStreakRestore.findOne({ user: req.user._id, monthKey: key }).lean();
    return res.json({ count: doc?.count || 0, restoredForDate: doc?.restoredForDate || "" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const restoreMyStreak = async (req, res) => {
  try {
    const { restoredForDate } = req.body || {};
    const restored = String(restoredForDate || "").slice(0, 10);
    if (!restored || restored.length !== 10) {
      return res.status(400).json({ message: "restoredForDate is required (YYYY-MM-DD)" });
    }

    const key = monthKeyUTC();
    const doc = await DailyReportStreakRestore.findOne({ user: req.user._id, monthKey: key });

    if (doc && doc.count >= 5) {
      return res.status(400).json({ message: "No restores left this month" });
    }

    const updated = await DailyReportStreakRestore.findOneAndUpdate(
      { user: req.user._id, monthKey: key },
      {
        $set: { restoredForDate: restored },
        $inc: { count: 1 },
      },
      { new: true, upsert: true }
    ).lean();

    return res.json({ count: updated.count, restoredForDate: updated.restoredForDate });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateDailyReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const roleName = String(req.user?.role?.role || req.user?.role?.plural || req.user?.role || "").toLowerCase();
    const canReview = /moderator|super\s*admin/.test(roleName);
    if (!canReview) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!status || !["Approved", "Pending", "Needs Improvement"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await DailyReport.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.json({ data: updated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
