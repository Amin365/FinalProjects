import express from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middleware/auth.js";
import {
  createDailyReport,
  getMyDailyReports,
  getMyStreakRestore,
  restoreMyStreak,
  updateDailyReportStatus,
} from "../controller/DailyReportController.js";

const DailyReportRouter = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

DailyReportRouter.get("/daily-reports", limiter, protect, getMyDailyReports);
DailyReportRouter.post("/daily-reports", limiter, protect, createDailyReport);

DailyReportRouter.get("/daily-reports/streak-restore", limiter, protect, getMyStreakRestore);
DailyReportRouter.post("/daily-reports/streak-restore", limiter, protect, restoreMyStreak);

DailyReportRouter.patch("/daily-reports/:id/status", limiter, protect, updateDailyReportStatus);

export default DailyReportRouter;
