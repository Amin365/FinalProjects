// programController.js
import Program from "../models/Program.js";

const ALLOWED_STATUS = ["active", "inactive", "completed", "draft"];

const escapeRegex = (str = "") =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeAssistants = (assistants) => {
  if (!assistants) return [];
  if (Array.isArray(assistants)) {
    return assistants.map(String).map((s) => s.trim()).filter(Boolean);
  }
  return String(assistants)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

export const createProgram = async (req, res) => {
  try {
    const {
      _id,
      title,
      description = "",
      capacity,
      teacherId,
      assistants = [],
      startDate,
      endDate,
      status = "active",
    } = req.body || {};

    // required validations
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!teacherId || !String(teacherId).trim()) {
      return res.status(400).json({ message: "teacherId is required" });
    }

    const cap = Number(capacity);
    if (capacity === undefined || Number.isNaN(cap) || !Number.isFinite(cap) || cap < 1) {
      return res.status(400).json({ message: "capacity must be a number >= 1" });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
      return res.status(400).json({ message: "Invalid startDate or endDate" });
    }
    if (s > e) {
      return res.status(400).json({ message: "startDate must be before or equal to endDate" });
    }

    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const assistantsArray = normalizeAssistants(assistants);

    const toCreate = {
      title: String(title).trim(),
      description: String(description || "").trim(),
      capacity: Math.floor(cap),
      teacherId: String(teacherId).trim(),
      assistants: assistantsArray,
      startDate: s,
      endDate: e,
      status,
    };

    // allow client-provided string _id but otherwise let schema default generate it
    if (_id && String(_id).trim()) {
      toCreate._id = String(_id).trim();
    }

    const program = await Program.create(toCreate);

    return res.status(201).json({ data: program });
  } catch (err) {
    // handle duplicate key for _id
    if (err.code === 11000) {
      return res.status(409).json({ message: "Program with provided id already exists" });
    }
    console.error("createProgram error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getPrograms = async (req, res) => {
  try {
    const { page = 1, limit = 20, q, status } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * perPage;

    const filter = {};
    if (status && ALLOWED_STATUS.includes(status)) filter.status = status;

    if (q?.trim()) {
      const regex = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [
        { _id: regex },
        { title: regex },
        { description: regex },
        { teacherId: regex },
      ];
    }

    const [items, total] = await Promise.all([
      Program.find(filter).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
      Program.countDocuments(filter),
    ]);

    return res.json({
      data: items,
      total,
      page: pageNum,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (err) {
    console.error("getPrograms error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getProgramById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Program id is required" });

    const program = await Program.findById(id).lean();
    if (!program) return res.status(404).json({ message: "Program not found" });

    return res.json({ data: program });
  } catch (err) {
    console.error("getProgramById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Program id is required" });

    const program = await Program.findById(id);
    if (!program) return res.status(404).json({ message: "Program not found" });

    const {
      title,
      description,
      capacity,
      teacherId,
      assistants,
      startDate,
      endDate,
      status,
    } = req.body || {};

    if (title !== undefined) program.title = String(title || "").trim();
    if (description !== undefined) program.description = String(description || "").trim();

    if (capacity !== undefined) {
      const cap = Number(capacity);
      if (Number.isNaN(cap) || !Number.isFinite(cap) || cap < 1) {
        return res.status(400).json({ message: "capacity must be a number >= 1" });
      }
      program.capacity = Math.floor(cap);
    }

    if (teacherId !== undefined) {
      if (!teacherId || !String(teacherId).trim()) {
        return res.status(400).json({ message: "teacherId cannot be empty" });
      }
      program.teacherId = String(teacherId).trim();
    }

    if (assistants !== undefined) {
      program.assistants = normalizeAssistants(assistants);
    }

    if (startDate !== undefined) {
      const ds = new Date(startDate);
      if (Number.isNaN(ds.getTime())) return res.status(400).json({ message: "Invalid startDate" });
      program.startDate = ds;
    }

    if (endDate !== undefined) {
      const de = new Date(endDate);
      if (Number.isNaN(de.getTime())) return res.status(400).json({ message: "Invalid endDate" });
      program.endDate = de;
    }

    // validate date ordering (schema also has pre("validate") but double-check here)
    if (program.startDate && program.endDate && program.startDate > program.endDate) {
      return res.status(400).json({ message: "startDate must be before or equal to endDate" });
    }

    if (status !== undefined) {
      if (!ALLOWED_STATUS.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      program.status = status;
    }

    await program.save();

    return res.json({ data: program });
  } catch (err) {
   
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate key error" });
    }
    console.error("updateProgram error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Program id is required" });

    const deleted = await Program.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ message: "Program not found" });

    return res.json({ success: true, message: "Program deleted" });
  } catch (err) {
    console.error("deleteProgram error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};