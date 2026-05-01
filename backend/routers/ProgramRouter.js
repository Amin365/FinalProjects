
import { Router } from "express";
import { protect, optionalProtect } from "../middleware/auth.js";
import {
  createProgram,
  getAvailableTeachers,
  getPrograms,
  getProgramById,
  updateProgram,
  deleteProgram,
} from "../controller/ProgrammController.js";

const Programrouter = Router();

Programrouter.get("/teachers/available", protect, getAvailableTeachers);
Programrouter.get("/", optionalProtect, getPrograms);
Programrouter.get("/:id", getProgramById);
Programrouter.post("/", protect, createProgram);
Programrouter.put("/:id", protect, updateProgram);
Programrouter.delete("/:id", protect, deleteProgram);

export default Programrouter;
