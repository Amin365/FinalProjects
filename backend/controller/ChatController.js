import ChatMessage from "../models/ChatMessage.js";
import Enrollment from "../models/Enrollment.js";
import Program from "../models/Program.js";
import User from "../models/user.js";

const getRoleNameFromUser = (user) =>
  String(user?.role?.role || user?.role?.plural || "").trim().toLowerCase();

const isSuperOrAdminRole = (roleName) =>
  /super\s*admin/i.test(roleName) || /^admin$/i.test(roleName);

const isLibraryStaffRole = (roleName) => /^library staff$/i.test(roleName);

const isVolunteerRole = (roleName) =>
  /^volunteer$/i.test(roleName) || /^volunteers$/i.test(roleName);

const isStudentRole = (roleName) =>
  /^student$/i.test(roleName) || /^students$/i.test(roleName);

// "staff-level" users who can chat everyone
const isStaffOmniChatRole = (roleName) =>
  isSuperOrAdminRole(roleName) || isLibraryStaffRole(roleName);
const threadKeyFor = (a, b) => {
  const [x, y] = [String(a), String(b)].sort();
  return `${x}__${y}`;
};

const formatTime = (d) =>
  new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const getUserByIdWithRole = async (userId) =>
  User.findById(userId)
    .select("first_name last_name email role profile_picture")
    .populate("role", "role plural")
    .lean();

const fullName = (u) =>
  [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim() || u?.email || "User";

const getPalette = () => [
  { bg: "#fff0e6", color: "#c2410c" },
  { bg: "#f0f9ff", color: "#0369a1" },
  { bg: "#f0fdf4", color: "#15803d" },
  { bg: "#fdf4ff", color: "#7e22ce" },
  { bg: "#fffbeb", color: "#92400e" },
  { bg: "#fff1f2", color: "#be123c" },
  { bg: "#eef2ff", color: "#4338ca" },
  { bg: "#ecfeff", color: "#0e7490" },
];

const pickColor = (id) => {
  const pal = getPalette();
  let hash = 0;
  const s = String(id || "");
  for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return pal[hash % pal.length];
};

const getStudentProgramIds = async (studentId) => {
  const enrollments = await Enrollment.find({
    userId: String(studentId),
    status: { $in: ["pending", "confirmed", "waitlisted"] },
  })
    .select("programId")
    .lean();

  return enrollments.map((e) => String(e.programId));
};

const getTeacherProgramIds = async (teacherId) => {
  const programs = await Program.find({
    $or: [{ teacherId: String(teacherId) }, { assistants: String(teacherId) }],
  })
    .select("_id")
    .lean();

  return programs.map((p) => String(p._id));
};


export const canChatWith = async (fromUserId, toUserId) => {
  const [fromUser, toUser] = await Promise.all([
    getUserByIdWithRole(fromUserId),
    getUserByIdWithRole(toUserId),
  ]);

  if (!fromUser || !toUser) return { allowed: false, status: 404, reason: "User not found" };

  const fromRole = getRoleNameFromUser(fromUser);
  const toRole = getRoleNameFromUser(toUser);

  // Super Admin/Admin/Library Staff can chat anyone
  if (isStaffOmniChatRole(fromRole)) return { allowed: true, fromUser, toUser };

  // Anyone can chat Super/Admin/Library Staff (support/staff)
  if (isStaffOmniChatRole(toRole)) return { allowed: true, fromUser, toUser };

  // Volunteer: ONLY their enrolled students (via their programs)
  if (isVolunteerRole(fromRole)) {
    if (!isStudentRole(toRole)) return { allowed: false, status: 403, reason: "Forbidden" };

    const volunteerPrograms = await getTeacherProgramIds(fromUserId); // uses teacherId/assistants
    if (!volunteerPrograms.length) return { allowed: false, status: 403, reason: "Forbidden" };

    const match = await Enrollment.findOne({
      userId: String(toUserId),
      programId: { $in: volunteerPrograms },
      status: { $in: ["pending", "confirmed", "waitlisted"] },
    })
      .select("_id")
      .lean();

    return match
      ? { allowed: true, fromUser, toUser }
      : { allowed: false, status: 403, reason: "Forbidden" };
  }

  // Student: chat other students, and their own program volunteer(s)
  if (isStudentRole(fromRole)) {
    if (isStudentRole(toRole)) return { allowed: true, fromUser, toUser };

    if (isVolunteerRole(toRole)) {
      const myPrograms = await getStudentProgramIds(fromUserId);
      if (!myPrograms.length) return { allowed: false, status: 403, reason: "Forbidden" };

      const programs = await Program.find({ _id: { $in: myPrograms } })
        .select("teacherId assistants")
        .lean();

      const allowedVolunteerIds = new Set();
      programs.forEach((p) => {
        if (p.teacherId) allowedVolunteerIds.add(String(p.teacherId));
        if (Array.isArray(p.assistants)) p.assistants.forEach((a) => allowedVolunteerIds.add(String(a)));
      });

      return allowedVolunteerIds.has(String(toUserId))
        ? { allowed: true, fromUser, toUser }
        : { allowed: false, status: 403, reason: "Forbidden" };
    }

    return { allowed: false, status: 403, reason: "Forbidden" };
  }

  return { allowed: false, status: 403, reason: "Forbidden" };
};

export const getChatContacts = async (req, res) => {
  try {
    const me = req.user?._id;
    if (!me) return res.status(401).json({ message: "Unauthorized" });

    const meUser = await getUserByIdWithRole(me);
    if (!meUser) return res.status(401).json({ message: "Unauthorized" });

    const myRole = getRoleNameFromUser(meUser);

    const contactIds = new Set();

    // super/admin: everyone
    if (isSuperOrAdminRole(myRole)) {
      const all = await User.find({ _id: { $ne: me } }).select("_id").lean();
      all.forEach((u) => contactIds.add(String(u._id)));
    } else if (isVolunteerRole(myRole)) {
      // teachers/volunteers/library staff: their students + admins
      const teacherPrograms = await getTeacherProgramIds(me);
      const studentEnrollments = teacherPrograms.length
        ? await Enrollment.find({
            programId: { $in: teacherPrograms },
            status: { $in: ["pending", "confirmed", "waitlisted"] },
          })
            .select("userId")
            .lean()
        : [];

      studentEnrollments.forEach((e) => contactIds.add(String(e.userId)));

      const maybeAdmins = await User.find({ _id: { $ne: me } })
        .populate("role", "role plural")
        .select("_id role")
        .lean();

      maybeAdmins.forEach((u) => {
        const r = getRoleNameFromUser(u);
        if (isSuperOrAdminRole(r)) contactIds.add(String(u._id));
      });
    } else if (isStudentRole(myRole)) {
      // students: all students + their program teachers/assistants + admins

      const others = await User.find({ _id: { $ne: me } })
        .populate("role", "role plural")
        .select("_id role")
        .lean();

      others.forEach((u) => {
        const r = getRoleNameFromUser(u);
        if (isStudentRole(r) || isSuperOrAdminRole(r)) contactIds.add(String(u._id));
      });

      const myPrograms = await getStudentProgramIds(me);
      const programs = myPrograms.length
        ? await Program.find({ _id: { $in: myPrograms } }).select("teacherId assistants").lean()
        : [];

      programs.forEach((p) => {
        if (p.teacherId) contactIds.add(String(p.teacherId));
        if (Array.isArray(p.assistants)) p.assistants.forEach((a) => contactIds.add(String(a)));
      });
    }

    contactIds.delete(String(me));

    const users = contactIds.size
      ? await User.find({ _id: { $in: Array.from(contactIds) } })
          .select("first_name last_name email profile_picture role")
          .populate("role", "role plural")
          .lean()
      : [];

    const threadKeys = users.map((u) => threadKeyFor(me, u._id));
    const lastMessages = threadKeys.length
      ? await ChatMessage.aggregate([
          { $match: { threadKey: { $in: threadKeys } } },
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: "$threadKey",
              message: { $first: "$$ROOT" },
            },
          },
        ])
      : [];

    const lastByThread = new Map(lastMessages.map((x) => [String(x._id), x.message]));

    const unreadCounts = threadKeys.length
      ? await ChatMessage.aggregate([
          {
            $match: {
              threadKey: { $in: threadKeys },
              to: String(me),
              readAt: null,
            },
          },
          { $group: { _id: "$threadKey", count: { $sum: 1 } } },
        ])
      : [];

    const unreadByThread = new Map(unreadCounts.map((x) => [String(x._id), Number(x.count)]));

    const contacts = users
      .map((u) => {
        const id = String(u._id);
        const tKey = threadKeyFor(me, id);
        const last = lastByThread.get(tKey);
        const unread = unreadByThread.get(tKey) || 0;
        const { bg, color } = pickColor(id);

        const name = fullName(u);
        const initials = `${(u.first_name || "").slice(0, 1)}${(u.last_name || "").slice(0, 1)}`
          .toUpperCase()
          .trim() ||
          String(name)
            .split(" ")
            .map((p) => p?.[0])
            .filter(Boolean)
            .join("")
            .slice(0, 2)
            .toUpperCase();

        const lastText = last?.text ? String(last.text) : "";
        const lastFileLabel = last?.fileUrl ? `File: ${String(last.fileName || "File")}` : "";
        const lastContent = lastText || lastFileLabel;
        const lastMsg = last
          ? String(last.from) === String(me)
            ? `You: ${lastContent}`
            : lastContent
          : "";

        return {
          id,
          name,
          initials,
          bg,
          color,
          online: false,
          lastSeen: null,
          unread,
          lastMsg,
          isTyping: false,
          time: last?.createdAt ? "" : "",
          _lastAt: last?.createdAt ? new Date(last.createdAt).getTime() : 0,
        };
      })
      .sort((a, b) => (b._lastAt || 0) - (a._lastAt || 0));

    // format time label after sorting
    const now = Date.now();
    const withTime = contacts.map((c) => {
      if (!c._lastAt) return { ...c, time: "" };
      const diffMs = now - c._lastAt;
      const diffMin = Math.round(diffMs / 60000);
      if (diffMin <= 1) return { ...c, time: "now" };
      if (diffMin < 60) return { ...c, time: `${diffMin}m` };
      const diffHr = Math.round(diffMin / 60);
      if (diffHr < 24) return { ...c, time: `${diffHr}h` };
      const diffDay = Math.round(diffHr / 24);
      return { ...c, time: `${diffDay}d` };
    });

    return res.json({ data: withTime });
  } catch (err) {
    console.error("getChatContacts error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getChatMessages = async (req, res) => {
  try {
    const me = req.user?._id;
    const { peerId } = req.params;
    if (!me) return res.status(401).json({ message: "Unauthorized" });

    const access = await canChatWith(me, peerId);
    if (!access.allowed) return res.status(access.status).json({ message: access.reason });

    const { limit = 50 } = req.query;
    const perPage = Math.min(200, Math.max(1, Number(limit)));
    const tKey = threadKeyFor(me, peerId);

    const msgs = await ChatMessage.find({ threadKey: tKey })
      .sort({ createdAt: 1 })
      .limit(perPage)
      .lean();

    // Mark peer->me messages as read
    await ChatMessage.updateMany(
      { threadKey: tKey, to: String(me), readAt: null },
      { $set: { readAt: new Date() } }
    );

    const data = msgs.map((m) => ({
      id: String(m._id),
      from: String(m.from),
      to: String(m.to),
      text: m.text,
      fileUrl: m.fileUrl || null,
      fileName: m.fileName || null,
      fileMimeType: m.fileMimeType || null,
      fileSize: typeof m.fileSize === "number" ? m.fileSize : null,
      time: formatTime(m.createdAt),
      status: String(m.from) === String(me) ? (m.readAt ? "read" : "sent") : undefined,
      createdAt: m.createdAt,
    }));

    return res.json({ data });
  } catch (err) {
    console.error("getChatMessages error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const postChatMessage = async (req, res) => {
  try {
    const me = req.user?._id;
    const { peerId } = req.params;
    const { text, fileUrl, fileName, fileMimeType, fileSize } = req.body || {};
    if (!me) return res.status(401).json({ message: "Unauthorized" });

    const messageText = String(text || "").trim();
    const url = fileUrl ? String(fileUrl).trim() : "";
    if (!messageText && !url) return res.status(400).json({ message: "text or fileUrl is required" });

    const access = await canChatWith(me, peerId);
    if (!access.allowed) return res.status(access.status).json({ message: access.reason });

    const msg = await ChatMessage.create({
      threadKey: threadKeyFor(me, peerId),
      from: String(me),
      to: String(peerId),
      text: messageText,
      fileUrl: url || null,
      fileName: fileName ? String(fileName) : null,
      fileMimeType: fileMimeType ? String(fileMimeType) : null,
      fileSize: typeof fileSize === "number" ? fileSize : null,
    });

    return res.status(201).json({
      data: {
        id: String(msg._id),
        from: String(msg.from),
        to: String(msg.to),
        text: msg.text,
        fileUrl: msg.fileUrl || null,
        fileName: msg.fileName || null,
        fileMimeType: msg.fileMimeType || null,
        fileSize: typeof msg.fileSize === "number" ? msg.fileSize : null,
        time: formatTime(msg.createdAt),
        status: "sent",
        createdAt: msg.createdAt,
      },
    });
  } catch (err) {
    console.error("postChatMessage error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const uploadChatFile = async (req, res) => {
  try {
    const me = req.user?._id;
    if (!me) return res.status(401).json({ message: "Unauthorized" });

    const file = req.file;
    if (!file) return res.status(400).json({ message: "file is required" });

    const url = file.path || file.secure_url || "";
    if (!url) return res.status(500).json({ message: "Upload failed" });

    return res.status(201).json({
      data: {
        url,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: typeof file.size === "number" ? file.size : typeof file.bytes === "number" ? file.bytes : null,
      },
    });
  } catch (err) {
    console.error("uploadChatFile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
