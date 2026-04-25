/**
 * Phase 5 - Admin Reporting Router
 * Routes for analytics and reporting endpoints
 */

import express from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middleware/auth.js";
import {
  getAdminReports,
  getTopReadersReport,
  getWeakestParticipation,
  getReadingHealth,
  getMonthlyComparison,
  getDepartmentComparison,
  getReportQuality,
  exportReportsCSV,
  getReportingSummary,
} from "../controller/ReportingController.js";

const ReportingRouter = express.Router();

// Rate limiter for reporting endpoints (expensive aggregations)
const reportingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ message: "Too many requests. Please slow down." }),
});

// Admin reports with filters
ReportingRouter.get("/reporting/admin-reports", reportingLimiter, protect, getAdminReports);

// Top readers report
ReportingRouter.get("/reporting/top-readers", reportingLimiter, protect, getTopReadersReport);

// Weakest participation report
ReportingRouter.get("/reporting/weakest-participation", reportingLimiter, protect, getWeakestParticipation);

// Reading health indicators
ReportingRouter.get("/reporting/reading-health", reportingLimiter, protect, getReadingHealth);

// Monthly comparison (current vs previous)
ReportingRouter.get("/reporting/monthly-comparison", reportingLimiter, protect, getMonthlyComparison);

// Department comparison
ReportingRouter.get("/reporting/department-comparison", reportingLimiter, protect, getDepartmentComparison);

// Report quality summary
ReportingRouter.get("/reporting/report-quality", reportingLimiter, protect, getReportQuality);

// Export endpoints
ReportingRouter.get("/reporting/export/csv", reportingLimiter, protect, exportReportsCSV);

// Summary for scheduled reports
ReportingRouter.get("/reporting/summary", reportingLimiter, protect, getReportingSummary);

export default ReportingRouter;
