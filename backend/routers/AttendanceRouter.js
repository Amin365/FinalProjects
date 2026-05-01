import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  getAttendanceByProgramAndDate,
  getAttendanceHistory,
  getAttendancePrograms,
  saveAttendance,
} from "../controller/AttendanceController.js";

const AttendanceRouter = Router();

AttendanceRouter.get("/attendance/programs", protect, getAttendancePrograms);
AttendanceRouter.get("/attendance/programs/:id", protect, getAttendanceByProgramAndDate);
AttendanceRouter.get("/attendance/programs/:id/history", protect, getAttendanceHistory);
AttendanceRouter.post("/attendance/programs/:id", protect, saveAttendance);

export default AttendanceRouter;
