import DailyReport from "../models/DailyReport.js";
import Issue from "../models/Issue.js";
import Member from "../models/Members.js";
import Program from "../models/Program.js";
import Enrollment from "../models/Enrollment.js";
import Clubreq from "../models/Clubreq.js";

function parseKpiRange(from, to) {
  const now = new Date();

  if (!from && !to) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
  }

  const start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
  if (Number.isNaN(start.getTime())) {
    const fallback = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: fallback, end: new Date(fallback.getFullYear(), fallback.getMonth() + 1, 1) };
  }
  start.setHours(0, 0, 0, 0);

  const end = to ? new Date(to) : new Date(start.getFullYear(), start.getMonth() + 1, 1);
  if (Number.isNaN(end.getTime())) {
    const fallbackEnd = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return { start, end: fallbackEnd };
  }
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function enrollmentStatusMatch() {
  return { $nin: ["cancelled", "rejected"] };
}

export const getLibraryKpis = async (req, res) => {
  try {
    const { from, to, limit = 5 } = req.query;
    const { start, end } = parseKpiRange(from, to);
    const lim = Math.max(1, Math.min(20, Number(limit) || 5));

    const [issuedBooks, programs, enrollments, volunteerRequests, topProgramsAgg] = await Promise.all([
      Issue.countDocuments({ issueDate: { $gte: start, $lte: end } }),
      Program.countDocuments({ startDate: { $gte: start, $lte: end } }),
      Enrollment.countDocuments({ createdAt: { $gte: start, $lte: end }, status: enrollmentStatusMatch() }),
      Clubreq.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Enrollment.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: enrollmentStatusMatch() } },
        { $group: { _id: "$programId", enrollments: { $sum: 1 } } },
        { $sort: { enrollments: -1 } },
        { $limit: lim },
        {
          $lookup: {
            from: "programs",
            localField: "_id",
            foreignField: "_id",
            as: "program",
          },
        },
        { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            programId: "$_id",
            title: "$program.title",
            enrollments: 1,
          },
        },
      ]),
    ]);

    const topPrograms = topProgramsAgg || [];
    const topProgram = topPrograms[0] || null;

    return res.json({
      data: {
        dateRange: {
          from: start.toISOString(),
          to: end.toISOString(),
        },
        issuedBooks,
        programs,
        enrollments,
        volunteerRequests,
        topProgram,
        topPrograms,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getTopProgramsByEnrollment = async (req, res) => {
  try {
    const { from, to, limit = 10 } = req.query;
    const { start, end } = parseKpiRange(from, to);
    const lim = Math.max(1, Math.min(50, Number(limit) || 10));

    const topPrograms = await Enrollment.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: enrollmentStatusMatch() } },
      { $group: { _id: "$programId", enrollments: { $sum: 1 } } },
      { $sort: { enrollments: -1 } },
      { $limit: lim },
      {
        $lookup: {
          from: "programs",
          localField: "_id",
          foreignField: "_id",
          as: "program",
        },
      },
      { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          programId: "$_id",
          title: "$program.title",
          enrollments: 1,
        },
      },
    ]);

    return res.json({
      data: {
        dateRange: { from: start.toISOString(), to: end.toISOString() },
        items: topPrograms,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

function parseDateRange(from, to) {
  const match = {};

  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      match.$gte = d;
    }
  }

  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      match.$lte = d;
    }
  }

  return Object.keys(match).length ? { readingDate: match } : {};
}

function buildMemberMatch({ department, study_year }) {
  const match = {};
  if (department) match.department = String(department);
  if (study_year) match.study_year = String(study_year);
  return match;
}

function normalizeLimit(v, fallback = 50) {
  const n = Number(v);
  if (Number.isNaN(n) || n <= 0) return fallback;
  return Math.max(1, Math.min(200, n));
}

function getMonthBoundariesUTC(date) {
  const d = new Date(date);
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  return { start, end };
}

function monthLabelUTC(date) {
  const d = new Date(date);
  return {
    name: d.toLocaleString("en-US", { month: "long", timeZone: "UTC" }),
    year: d.getUTCFullYear(),
  };
}

async function getMemberCountsByDepartment() {
  const grouped = await Member.aggregate([
    { $match: { isArchived: false } },
    {
      $group: {
        _id: "$department",
        totalMembers: { $sum: 1 },
      },
    },
  ]);

  const map = new Map();
  for (const g of grouped) {
    const dept = String(g._id || "").trim();
    if (!dept) continue;
    map.set(dept, g.totalMembers);
  }
  return map;
}

async function aggregateWithMemberFilters({ from, to, status, department, study_year, groupStage, projectStage }) {
  const dateMatch = parseDateRange(from, to);
  const memberMatch = buildMemberMatch({ department, study_year });

  const match = {
    ...dateMatch,
  };
  if (status) match.status = String(status);

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $lookup: {
        from: "members",
        localField: "user.member",
        foreignField: "_id",
        as: "member",
      },
    },
    { $unwind: { path: "$member", preserveNullAndEmptyArrays: true } },
  ];

  if (Object.keys(memberMatch).length) {
    pipeline.push({ $match: Object.fromEntries(Object.entries(memberMatch).map(([k, v]) => [`member.${k}`, v])) });
  }

  pipeline.push(
    {
      $addFields: {
        pagesRead: {
          $max: [0, { $subtract: ["$pagesTo", "$pagesFrom"] }],
        },
        memberDepartment: "$member.department",
        memberStudyYear: "$member.study_year",
      },
    },
    groupStage
  );

  if (projectStage) pipeline.push(projectStage);

  return DailyReport.aggregate(pipeline);
}

export const getAdminReports = async (req, res) => {
  try {
    const { from, to, status, department, study_year, limit = 50, page = 1 } = req.query;

    const lim = normalizeLimit(limit, 50);
    const pg = Math.max(1, Number(page) || 1);
    const skip = (pg - 1) * lim;

    const dateMatch = parseDateRange(from, to);
    const match = { ...dateMatch };
    if (status) match.status = String(status);

    const memberMatch = buildMemberMatch({ department, study_year });

    const basePipeline = [
      { $match: match },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      { $unwind: "$createdBy" },
      {
        $lookup: {
          from: "members",
          localField: "createdBy.member",
          foreignField: "_id",
          as: "member",
        },
      },
      { $unwind: { path: "$member", preserveNullAndEmptyArrays: true } },
    ];

    if (Object.keys(memberMatch).length) {
      basePipeline.push({
        $match: Object.fromEntries(Object.entries(memberMatch).map(([k, v]) => [`member.${k}`, v])),
      });
    }

    basePipeline.push(
      {
        $lookup: {
          from: "books",
          localField: "book",
          foreignField: "_id",
          as: "book",
        },
      },
      { $unwind: { path: "$book", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          memberDepartment: "$member.department",
          memberStudyYear: "$member.study_year",
          pagesRead: { $max: [0, { $subtract: ["$pagesTo", "$pagesFrom"] }] },
        },
      }
    );

    const [rows, totalAgg] = await Promise.all([
      DailyReport.aggregate([
        ...basePipeline,
        { $sort: { readingDate: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: lim },
        {
          $project: {
            book: { _id: 1, title: 1 },
            createdBy: { _id: 1, first_name: 1, last_name: 1 },
            memberDepartment: 1,
            memberStudyYear: 1,
            readingDate: 1,
            pagesFrom: 1,
            pagesTo: 1,
            pagesRead: 1,
            timeSpent: 1,
            summary: 1,
            rating: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]),
      DailyReport.aggregate([...basePipeline, { $count: "total" }]),
    ]);

    return res.json({ data: rows, total: totalAgg[0]?.total || 0 });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getTopReadersReport = async (req, res) => {
  try {
    const { from, to, department, study_year, limit = 10 } = req.query;
    const lim = normalizeLimit(limit, 10);

    const grouped = await aggregateWithMemberFilters({
      from,
      to,
      department,
      study_year,
      groupStage: {
        $group: {
          _id: "$createdBy",
          reportsCount: { $sum: 1 },
          pagesRead: { $sum: "$pagesRead" },
          user: { $first: "$user" },
          member: { $first: "$member" },
        },
      },
      projectStage: {
        $project: {
          reportsCount: 1,
          pagesRead: 1,
          user: {
            _id: "$user._id",
            first_name: "$user.first_name",
            last_name: "$user.last_name",
            department: "$member.department",
            study_year: "$member.study_year",
          },
        },
      },
    });

    grouped.sort((a, b) => b.reportsCount - a.reportsCount);

    return res.json({ data: grouped.slice(0, lim) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getWeakestParticipation = async (req, res) => {
  try {
    const { from, to, department, study_year, limit = 10 } = req.query;
    const lim = normalizeLimit(limit, 10);

    const memberMatch = buildMemberMatch({ department, study_year });

    // Build a user list via member filters (includes users with 0 reports)
    const members = await Member.find(Object.keys(memberMatch).length ? memberMatch : {})
      .select("_id first_name middle_name last_name department study_year")
      .limit(5000)
      .lean();

    if (!members.length) return res.json({ data: [] });

    // Map memberId -> display
    const memberMap = new Map(
      members.map((m) => [
        String(m._id),
        {
          _id: m._id,
          name: [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(" "),
          department: m.department || "",
          study_year: m.study_year || "",
        },
      ])
    );

    // Users are 1:1 with member, but createdBy points to User; we can lookup via reports aggregation.
    // We will compute counts per member by joining to user in aggregation.

    const dateMatch = parseDateRange(from, to);

    const agg = await DailyReport.aggregate([
      { $match: { ...dateMatch } },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $group: {
          _id: "$user.member",
          reportsCount: { $sum: 1 },
          lastReadingDate: { $max: "$readingDate" },
        },
      },
    ]);

    const statsByMember = new Map(agg.map((a) => [String(a._id), a]));

    const today = new Date();

    const merged = Array.from(memberMap.entries()).map(([memberId, m]) => {
      const stats = statsByMember.get(memberId);
      const last = stats?.lastReadingDate ? new Date(stats.lastReadingDate) : null;
      const daysSinceLastReport = last
        ? Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        member: m,
        reportsCount: stats?.reportsCount || 0,
        daysSinceLastReport,
      };
    });

    merged.sort((a, b) => {
      if (a.reportsCount !== b.reportsCount) return a.reportsCount - b.reportsCount;
      const ad = a.daysSinceLastReport ?? 10_000;
      const bd = b.daysSinceLastReport ?? 10_000;
      return bd - ad;
    });

    return res.json({ data: merged.slice(0, lim) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getReadingHealth = async (req, res) => {
  try {
    const { daysInactive = 7, department, study_year } = req.query;
    const nDays = Math.max(1, Math.min(90, Number(daysInactive) || 7));

    const memberMatch = buildMemberMatch({ department, study_year });
    const members = await Member.find(Object.keys(memberMatch).length ? memberMatch : {})
      .select("_id first_name middle_name last_name department study_year")
      .limit(10_000)
      .lean();

    const memberIds = members.map((m) => m._id);

    // DailyReport -> createdBy -> user.member; aggregate per member
    const byMember = await DailyReport.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $match: { "user.member": { $in: memberIds } } },
      {
        $group: {
          _id: "$user.member",
          totalReports: { $sum: 1 },
          lastReadingDate: { $max: "$readingDate" },
        },
      },
    ]);

    const stats = new Map(byMember.map((s) => [String(s._id), s]));

    const today = new Date();
    const inactiveReaders = [];
    const noReports = [];

    for (const m of members) {
      const s = stats.get(String(m._id));
      if (!s) {
        noReports.push({ member: m });
        continue;
      }

      const last = s.lastReadingDate ? new Date(s.lastReadingDate) : null;
      const daysSinceReport = last
        ? Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      if (daysSinceReport !== null && daysSinceReport >= nDays) {
        inactiveReaders.push({
          member: {
            _id: m._id,
            name: [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(" "),
            department: m.department || "",
            study_year: m.study_year || "",
          },
          daysSinceReport,
          totalReports: s.totalReports,
        });
      }
    }

    // Overdue issues + inactive
    const inactiveMemberSet = new Set(inactiveReaders.map((x) => String(x.member._id)));

    const overdueInactive = await Issue.find({ status: "Overdue", member: { $in: Array.from(inactiveMemberSet) } })
      .populate("book", "title")
      .populate("member", "first_name last_name")
      .lean();

    return res.json({
      summary: {
        totalInactive: inactiveReaders.length,
        totalNoReports: noReports.length,
        totalLowStreak: 0,
        totalOverdueInactive: overdueInactive.length,
      },
      data: {
        inactiveReaders,
        noReports: noReports.map((x) => ({
          member: {
            _id: x.member._id,
            name: [x.member.first_name, x.member.middle_name, x.member.last_name].filter(Boolean).join(" "),
            department: x.member.department || "",
            study_year: x.member.study_year || "",
          },
        })),
        overdueInactive,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMonthlyComparison = async (req, res) => {
  try {
    const { department, study_year } = req.query;

    const now = new Date();
    const { start: curStart, end: curEnd } = getMonthBoundariesUTC(now);

    const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const { start: prevStart, end: prevEnd } = getMonthBoundariesUTC(prev);

    const memberMatch = buildMemberMatch({ department, study_year });

    const pipeline = (start, end) => {
      const base = [
        { $match: { readingDate: { $gte: start, $lt: end } } },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $lookup: {
            from: "members",
            localField: "user.member",
            foreignField: "_id",
            as: "member",
          },
        },
        { $unwind: { path: "$member", preserveNullAndEmptyArrays: true } },
      ];

      if (Object.keys(memberMatch).length) {
        base.push({ $match: Object.fromEntries(Object.entries(memberMatch).map(([k, v]) => [`member.${k}`, v])) });
      }

      base.push(
        {
          $addFields: {
            pagesRead: { $max: [0, { $subtract: ["$pagesTo", "$pagesFrom"] }] },
          },
        },
        {
          $group: {
            _id: null,
            totalReports: { $sum: 1 },
            pagesRead: { $sum: "$pagesRead" },
            uniqueReaders: { $addToSet: "$createdBy" },
            avgRating: { $avg: "$rating" },
          },
        }
      );

      return base;
    };

    const [curAgg, prevAgg] = await Promise.all([
      DailyReport.aggregate(pipeline(curStart, curEnd)),
      DailyReport.aggregate(pipeline(prevStart, prevEnd)),
    ]);

    const cur = curAgg[0] || { totalReports: 0, pagesRead: 0, uniqueReaders: [], avgRating: 0 };
    const prevRes = prevAgg[0] || { totalReports: 0, pagesRead: 0, uniqueReaders: [], avgRating: 0 };

    const currentMonth = {
      ...monthLabelUTC(curStart),
      totalReports: cur.totalReports,
      pagesRead: cur.pagesRead,
      uniqueReaders: cur.uniqueReaders?.length || 0,
      avgRating: cur.avgRating || 0,
    };

    const previousMonth = {
      ...monthLabelUTC(prevStart),
      totalReports: prevRes.totalReports,
      pagesRead: prevRes.pagesRead,
      uniqueReaders: prevRes.uniqueReaders?.length || 0,
      avgRating: prevRes.avgRating || 0,
    };

    const pct = (a, b) => {
      if (!b) return a ? 100 : 0;
      return Math.round(((a - b) / b) * 100);
    };

    return res.json({
      data: {
        currentMonth,
        previousMonth,
        changes: {
          reportsChange: pct(currentMonth.totalReports, previousMonth.totalReports),
          pagesChange: pct(currentMonth.pagesRead, previousMonth.pagesRead),
          readersChange: pct(currentMonth.uniqueReaders, previousMonth.uniqueReaders),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getDepartmentComparison = async (req, res) => {
  try {
    const { from, to } = req.query;

    const deptCounts = await getMemberCountsByDepartment();

    const dateMatch = parseDateRange(from, to);

    const agg = await DailyReport.aggregate([
      { $match: { ...dateMatch } },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "members",
          localField: "user.member",
          foreignField: "_id",
          as: "member",
        },
      },
      { $unwind: { path: "$member", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          department: "$member.department",
          pagesRead: { $max: [0, { $subtract: ["$pagesTo", "$pagesFrom"] }] },
        },
      },
      { $match: { department: { $ne: "" } } },
      {
        $group: {
          _id: "$department",
          totalReports: { $sum: 1 },
          pagesRead: { $sum: "$pagesRead" },
          avgRating: { $avg: "$rating" },
          activeReadersSet: { $addToSet: "$createdBy" },
        },
      },
      {
        $project: {
          department: "$_id",
          totalReports: 1,
          pagesRead: 1,
          avgRating: 1,
          activeReaders: { $size: "$activeReadersSet" },
        },
      },
      { $sort: { totalReports: -1 } },
    ]);

    const out = agg.map((d) => ({
      department: d.department,
      totalMembers: deptCounts.get(d.department) || 0,
      activeReaders: d.activeReaders || 0,
      totalReports: d.totalReports || 0,
      pagesRead: d.pagesRead || 0,
      avgRating: d.avgRating || 0,
    }));

    return res.json({ data: out });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getReportQuality = async (req, res) => {
  try {
    const { from, to, department, study_year } = req.query;

    const dateMatch = parseDateRange(from, to);
    const memberMatch = buildMemberMatch({ department, study_year });

    const base = [
      { $match: { ...dateMatch } },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "members",
          localField: "user.member",
          foreignField: "_id",
          as: "member",
        },
      },
      { $unwind: { path: "$member", preserveNullAndEmptyArrays: true } },
    ];

    if (Object.keys(memberMatch).length) {
      base.push({ $match: Object.fromEntries(Object.entries(memberMatch).map(([k, v]) => [`member.${k}`, v])) });
    }

    const [statsAgg, distAgg] = await Promise.all([
      DailyReport.aggregate([
        ...base,
        {
          $addFields: {
            pagesRead: { $max: [0, { $subtract: ["$pagesTo", "$pagesFrom"] }] },
          },
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            avgTimeSpent: { $avg: "$timeSpent" },
            avgPagesRead: { $avg: "$pagesRead" },
            totalApprovedReports: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] } },
          },
        },
      ]),
      DailyReport.aggregate([
        ...base,
        { $group: { _id: "$rating", count: { $sum: 1 } } },
      ]),
    ]);

    const stats = statsAgg[0] || { avgRating: 0, avgTimeSpent: 0, avgPagesRead: 0, totalApprovedReports: 0 };

    const ratingDistribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    for (const d of distAgg) {
      const k = String(d._id);
      if (ratingDistribution[k] !== undefined) ratingDistribution[k] = d.count;
    }

    return res.json({
      data: {
        avgRating: stats.avgRating || 0,
        avgTimeSpent: stats.avgTimeSpent || 0,
        avgPagesRead: stats.avgPagesRead || 0,
        totalApprovedReports: stats.totalApprovedReports || 0,
        ratingDistribution,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const exportReportsCSV = async (req, res) => {
  try {
    const { type = "reports", from, to, status, department, study_year } = req.query;

    const esc = (v) => {
      const s = String(v ?? "");
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    if (type === "leaderboard") {
      const top = await getTopReadersReportInternal({ from, to, department, study_year, limit: 200 });
      const header = ["Rank", "First Name", "Last Name", "Department", "Study Year", "Reports", "Pages Read"].join(",");
      const rows = top.map((r, idx) => [
        idx + 1,
        esc(r.user?.first_name),
        esc(r.user?.last_name),
        esc(r.user?.department),
        esc(r.user?.study_year),
        r.reportsCount,
        r.pagesRead,
      ].join(","));

      const csv = [header, ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=leaderboard-${new Date().toISOString().slice(0, 10)}.csv`);
      return res.send(csv);
    }

    // reports export
    const dateMatch = parseDateRange(from, to);
    const match = { ...dateMatch };
    if (status) match.status = String(status);

    const memberMatch = buildMemberMatch({ department, study_year });

    const pipeline = [
      { $match: match },
      {
        $lookup: { from: "users", localField: "createdBy", foreignField: "_id", as: "user" },
      },
      { $unwind: "$user" },
      {
        $lookup: { from: "members", localField: "user.member", foreignField: "_id", as: "member" },
      },
      { $unwind: { path: "$member", preserveNullAndEmptyArrays: true } },
    ];

    if (Object.keys(memberMatch).length) {
      pipeline.push({ $match: Object.fromEntries(Object.entries(memberMatch).map(([k, v]) => [`member.${k}`, v])) });
    }

    pipeline.push(
      { $lookup: { from: "books", localField: "book", foreignField: "_id", as: "book" } },
      { $unwind: { path: "$book", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          pagesRead: { $max: [0, { $subtract: ["$pagesTo", "$pagesFrom"] }] },
        },
      },
      { $sort: { readingDate: -1 } }
    );

    const reports = await DailyReport.aggregate(pipeline);

    const header = [
      "Reading Date",
      "First Name",
      "Last Name",
      "Department",
      "Study Year",
      "Book",
      "Pages From",
      "Pages To",
      "Pages Read",
      "Time Spent (min)",
      "Rating",
      "Status",
      "Summary",
    ].join(",");

    const rows = reports.map((r) => [
      esc(r.readingDate ? new Date(r.readingDate).toISOString().slice(0, 10) : ""),
      esc(r.user?.first_name),
      esc(r.user?.last_name),
      esc(r.member?.department),
      esc(r.member?.study_year),
      esc(r.book?.title),
      r.pagesFrom ?? "",
      r.pagesTo ?? "",
      r.pagesRead ?? "",
      r.timeSpent ?? "",
      r.rating ?? "",
      esc(r.status),
      esc(r.summary),
    ].join(","));

    const csv = [header, ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=reports-${new Date().toISOString().slice(0, 10)}.csv`);
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

async function getTopReadersReportInternal({ from, to, department, study_year, limit = 200 }) {
  const lim = normalizeLimit(limit, 200);

  const grouped = await aggregateWithMemberFilters({
    from,
    to,
    department,
    study_year,
    groupStage: {
      $group: {
        _id: "$createdBy",
        reportsCount: { $sum: 1 },
        pagesRead: { $sum: "$pagesRead" },
        user: { $first: "$user" },
        member: { $first: "$member" },
      },
    },
    projectStage: {
      $project: {
        reportsCount: 1,
        pagesRead: 1,
        user: {
          _id: "$user._id",
          first_name: "$user.first_name",
          last_name: "$user.last_name",
          department: "$member.department",
          study_year: "$member.study_year",
        },
      },
    },
  });

  grouped.sort((a, b) => b.reportsCount - a.reportsCount);
  return grouped.slice(0, lim);
}

export const getReportingSummary = async (req, res) => {
  try {
    const { period = "weekly" } = req.query;
    const now = new Date();
    const from = new Date(now);
    if (String(period).toLowerCase() === "monthly") {
      from.setUTCDate(1);
      from.setUTCHours(0, 0, 0, 0);
    } else {
      from.setUTCDate(from.getUTCDate() - 7);
      from.setUTCHours(0, 0, 0, 0);
    }

    const agg = await DailyReport.aggregate([
      { $match: { readingDate: { $gte: from, $lte: now } } },
      {
        $addFields: {
          pagesRead: { $max: [0, { $subtract: ["$pagesTo", "$pagesFrom"] }] },
        },
      },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          approvedReports: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] } },
          pendingReports: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          pagesRead: { $sum: "$pagesRead" },
          minutesRead: { $sum: "$timeSpent" },
          avgRating: { $avg: "$rating" },
          uniqueReaders: { $addToSet: "$createdBy" },
        },
      },
    ]);

    const s = agg[0] || {
      totalReports: 0,
      approvedReports: 0,
      pendingReports: 0,
      pagesRead: 0,
      minutesRead: 0,
      avgRating: 0,
      uniqueReaders: [],
    };

    return res.json({
      data: {
        period,
        dateRange: { from: from.toISOString(), to: now.toISOString() },
        overview: {
          totalReports: s.totalReports,
          approvedReports: s.approvedReports,
          pendingReports: s.pendingReports,
          pagesRead: s.pagesRead,
          minutesRead: s.minutesRead,
          avgRating: Math.round((s.avgRating || 0) * 10) / 10,
          activeReaders: s.uniqueReaders?.length || 0,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
