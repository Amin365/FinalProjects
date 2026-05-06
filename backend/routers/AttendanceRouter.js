import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { requirePermission } from "../middleware/role.js";
import {
  getAttendanceByProgramAndDate,
  getAttendanceHistory,
  getAttendancePrograms,
  saveAttendance,
} from "../controller/AttendanceController.js";

const AttendanceRouter = Router();

const viewAttendance = [protect, requirePermission("View Attendance")];
const manageAttendance = [protect, requirePermission("Manage Attendance")];

AttendanceRouter.get("/attendance/programs", viewAttendance, getAttendancePrograms);
AttendanceRouter.get("/attendance/programs/:id", viewAttendance, getAttendanceByProgramAndDate);
AttendanceRouter.get("/attendance/programs/:id/history", viewAttendance, getAttendanceHistory);
AttendanceRouter.post("/attendance/programs/:id", manageAttendance, saveAttendance);

export default AttendanceRouter;
