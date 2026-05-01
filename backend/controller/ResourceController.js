import mongoose from "mongoose";
import Resource from "../models/Resource.js";
import User from "../models/user.js";
import "../models/Program.js";

const ALLOWED_TYPES = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "video", "link", "other"];
const ALLOWED_ACCESS = ["public", "private", "program-only"];

const isAdmin = async (userId) => {
  const user = await User.findById(userId).populate("role", "role plural").lean();
  if (!user) return false;
  const roleName = (user.role?.role || user.role?.plural || "").toLowerCase();
  return /super\s*admin/i.test(roleName) || /^admin$/i.test(roleName);
};

const isTeacher = async (userId) => {
  const user = await User.findById(userId).populate("role", "role plural").lean();
  if (!user) return false;
  const roleName = (user.role?.role || user.role?.plural || "").toLowerCase();
  return /^library\s*staff$/i.test(roleName) || /^teacher$/i.test(roleName);
};

const canManageProgramResource = async (userId, programId) => {
  if (!programId) return false;
  const program = await mongoose.model("Program").findById(programId).select("teacherId").lean();
  return Boolean(program && String(program.teacherId) === String(userId));
};

const getUploadedFile = (file) => file?.path || file?.secure_url || file?.url || "";

/**
 * POST /resources (admin only)
 */
export const createResource = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const admin = await isAdmin(userId);
    const teacher = await isTeacher(userId);
    if (!admin && !teacher) return res.status(403).json({ message: "Only admin or assigned teacher can create resources" });

    const {
      title,
      description = "",
      type = "pdf",
      fileUrl: fileUrlFromBody = "",
      category = "",
      programId = null,
      accessLevel = "public",
    } = req.body || {};

    if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
    if (!ALLOWED_TYPES.includes(type)) return res.status(400).json({ message: "Invalid type" });
    if (!ALLOWED_ACCESS.includes(accessLevel)) return res.status(400).json({ message: "Invalid accessLevel" });

    if (programId && !String(programId).trim()) {
      return res.status(400).json({ message: "Invalid programId" });
    }
    if (!admin && !(await canManageProgramResource(userId, programId))) {
      return res.status(403).json({ message: "You can only create resources for programs you teach" });
    }

    const uploadedFile = getUploadedFile(req.files?.file?.[0]);
    const fileUrl = uploadedFile || String(fileUrlFromBody || "").trim();
    if (!fileUrl) return res.status(400).json({ message: "fileUrl (or uploaded file) is required" });

    const resource = await Resource.create({
      title: title.trim(),
      description: description?.trim() || "",
      type,
      fileUrl,
      category: category?.trim() || "",
      programId: programId || null,
      uploadedBy: userId,
      accessLevel,
    });

    return res.status(201).json({ data: resource });
  } catch (err) {
    console.error("createResource:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /resources
 */
export const getResources = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, accessLevel, programId, q, uploadedBy, mine } = req.query;

    const pageNum = Math.max(1, Number(page));
    const perPage = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * perPage;

    const filter = {};
    if (type && ALLOWED_TYPES.includes(type)) filter.type = type;
    if (category?.trim()) filter.category = new RegExp(category.trim(), "i");
    if (accessLevel && ALLOWED_ACCESS.includes(accessLevel)) filter.accessLevel = accessLevel;
    if (programId && String(programId).trim()) filter.programId = String(programId).trim();
    if (uploadedBy && mongoose.isValidObjectId(uploadedBy)) filter.uploadedBy = uploadedBy;
    if (mine === "true") {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const teacherPrograms = await mongoose.model("Program").find({ teacherId: String(userId) }).select("_id").lean();
      filter.programId = { $in: teacherPrograms.map((program) => String(program._id)) };
    }

    if (q?.trim()) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: regex }, { description: regex }, { category: regex }];
    }

    const [resources, total] = await Promise.all([
      Resource.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .populate("uploadedBy", "email first_name last_name profile_picture")
        .populate("programId", "title description status startDate endDate")
        .lean(),
      Resource.countDocuments(filter),
    ]);

    return res.json({
      data: resources,
      total,
      page: pageNum,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (err) {
    console.error("getResources:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /resources/:id
 */
export const getResourceById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid resource id" });

    const resource = await Resource.findById(id)
      .populate("uploadedBy", "email first_name last_name profile_picture")
      .populate("programId", "title description status startDate endDate")
      .lean();

    if (!resource) return res.status(404).json({ message: "Resource not found" });
    return res.json({ data: resource });
  } catch (err) {
    console.error("getResourceById:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /resources/:id (admin only)
 */
export const updateResource = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const admin = await isAdmin(userId);
    const teacher = await isTeacher(userId);
    if (!admin && !teacher) return res.status(403).json({ message: "Only admin or assigned teacher can update resources" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid resource id" });

    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    if (!admin && !(await canManageProgramResource(userId, resource.programId))) {
      return res.status(403).json({ message: "You can only update resources for programs you teach" });
    }

    const { title, description, type, fileUrl, category, programId, accessLevel } = req.body || {};

    if (title !== undefined) {
      if (!String(title).trim()) return res.status(400).json({ message: "Title cannot be empty" });
      resource.title = String(title).trim();
    }
    if (description !== undefined) resource.description = String(description || "").trim();

    if (type !== undefined) {
      if (!ALLOWED_TYPES.includes(type)) return res.status(400).json({ message: "Invalid type" });
      resource.type = type;
    }

    const uploadedFile = getUploadedFile(req.files?.file?.[0]);
    if (uploadedFile) {
      resource.fileUrl = uploadedFile;
    } else if (fileUrl !== undefined) {
      if (!String(fileUrl).trim()) return res.status(400).json({ message: "fileUrl cannot be empty" });
      resource.fileUrl = String(fileUrl).trim();
    }

    if (category !== undefined) resource.category = String(category || "").trim();

    if (programId !== undefined) {
      if (programId === null || programId === "") resource.programId = null;
      else {
        if (!admin && !(await canManageProgramResource(userId, programId))) {
          return res.status(403).json({ message: "You can only assign resources to programs you teach" });
        }
        resource.programId = String(programId).trim();
      }
    }

    if (accessLevel !== undefined) {
      if (!ALLOWED_ACCESS.includes(accessLevel)) return res.status(400).json({ message: "Invalid accessLevel" });
      resource.accessLevel = accessLevel;
    }

    await resource.save();
    return res.json({ data: resource });
  } catch (err) {
    console.error("updateResource:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /resources/:id (admin only)
 */
export const deleteResource = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const admin = await isAdmin(userId);
    const teacher = await isTeacher(userId);
    if (!admin && !teacher) return res.status(403).json({ message: "Only admin or assigned teacher can delete resources" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid resource id" });

    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    if (!admin && !(await canManageProgramResource(userId, resource.programId))) {
      return res.status(403).json({ message: "You can only delete resources for programs you teach" });
    }

    await resource.deleteOne();
    return res.json({ success: true, message: "Resource deleted" });
  } catch (err) {
    console.error("deleteResource:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /resources/:id/downloads
 */
export const incrementResourceDownloads = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid resource id" });

    const updated = await Resource.findByIdAndUpdate(
      id,
      { $inc: { downloads: 1 } },
      { new: true, select: "downloads fileUrl" }
    );

    if (!updated) return res.status(404).json({ message: "Resource not found" });

    return res.json({ downloads: updated.downloads, fileUrl: updated.fileUrl });
  } catch (err) {
    console.error("incrementResourceDownloads:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /resources/:id/views
 */
export const incrementResourceViews = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid resource id" });

    const updated = await Resource.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true, select: "views" });
    if (!updated) return res.status(404).json({ message: "Resource not found" });

    return res.json({ views: updated.views });
  } catch (err) {
    console.error("incrementResourceViews:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /resources/types/summary
 */
export const getResourceTypeSummary = async (_req, res) => {
  try {
    const summary = await Resource.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $project: { _id: 0, type: "$_id", count: 1 } },
      { $sort: { type: 1 } },
    ]);

    return res.json({ data: summary });
  } catch (err) {
    console.error("getResourceTypeSummary:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
