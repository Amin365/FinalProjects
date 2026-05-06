/**
 * Phase 5 - Admin Reporting Router
 * Routes for analytics and reporting endpoints
 */

import express from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middleware/auth.js";
import { requirePermission } from "../middleware/role.js";
import {
  getLibraryKpis,
  getTopProgramsByEnrollment,
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

const viewReports = [protect, requirePermission("View Reports")];

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
ReportingRouter.get("/reporting/admin-reports", reportingLimiter, viewReports, getAdminReports);

// KPI reports (library + programs)
ReportingRouter.get("/reporting/kpis", reportingLimiter, viewReports, getLibraryKpis);
ReportingRouter.get("/reporting/top-programs", reportingLimiter, viewReports, getTopProgramsByEnrollment);

// Top readers report
ReportingRouter.get("/reporting/top-readers", reportingLimiter, viewReports, getTopReadersReport);

// Weakest participation report
ReportingRouter.get("/reporting/weakest-participation", reportingLimiter, viewReports, getWeakestParticipation);

// Reading health indicators
ReportingRouter.get("/reporting/reading-health", reportingLimiter, viewReports, getReadingHealth);

// Monthly comparison (current vs previous)
ReportingRouter.get("/reporting/monthly-comparison", reportingLimiter, viewReports, getMonthlyComparison);

// Department comparison
ReportingRouter.get("/reporting/department-comparison", reportingLimiter, viewReports, getDepartmentComparison);

// Report quality summary
ReportingRouter.get("/reporting/report-quality", reportingLimiter, viewReports, getReportQuality);

// Export endpoints
ReportingRouter.get("/reporting/export/csv", reportingLimiter, viewReports, exportReportsCSV);

// Summary for scheduled reports
ReportingRouter.get("/reporting/summary", reportingLimiter, viewReports, getReportingSummary);

export default ReportingRouter;
