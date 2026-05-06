
import { Router } from "express";
import { protect, optionalProtect } from "../middleware/auth.js";
import { requirePermission } from "../middleware/role.js";
import {
  createProgram,
  getAvailableTeachers,
  getPrograms,
  getProgramById,
  updateProgram,
  deleteProgram,
} from "../controller/ProgrammController.js";

const Programrouter = Router();

const managePrograms = [protect, requirePermission("Manage Programme")];

Programrouter.get("/teachers/available", managePrograms, getAvailableTeachers);
Programrouter.get("/", optionalProtect, getPrograms);
Programrouter.get("/:id", getProgramById);
Programrouter.post("/", managePrograms, createProgram);
Programrouter.put("/:id", managePrograms, updateProgram);
Programrouter.delete("/:id", managePrograms, deleteProgram);

export default Programrouter;
