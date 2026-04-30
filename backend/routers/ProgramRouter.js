
import { Router } from "express";
import {
  createProgram,
  getPrograms,
  getProgramById,
  updateProgram,
  deleteProgram,
} from "../controller/ProgrammController.js";

const Programrouter = Router();

Programrouter.get("/", getPrograms);
Programrouter.get("/:id", getProgramById);
Programrouter.post("/", createProgram);
Programrouter.put("/:id", updateProgram);
Programrouter.delete("/:id", deleteProgram);

export default Programrouter;
