import express from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middleware/auth.js";
import {
  getDashboardStats,
  getRecentActivity,
  getTopReaders,
  getPopularBooks,
  getPendingApprovals,
} from "../controller/DashboardController.js";

const DashboardRouter = express.Router();

// Protect expensive aggregation endpoints from abuse (100 req / 15 min per IP)
const dashboardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ message: "Too many requests. Please slow down." }),
});

DashboardRouter.get("/dashboard/stats", dashboardLimiter, protect, getDashboardStats);
DashboardRouter.get("/dashboard/activity", dashboardLimiter, protect, getRecentActivity);
DashboardRouter.get("/dashboard/top-readers", dashboardLimiter, protect, getTopReaders);
DashboardRouter.get("/dashboard/popular-books", dashboardLimiter, protect, getPopularBooks);
DashboardRouter.get("/dashboard/pending-approvals", dashboardLimiter, protect, getPendingApprovals);

export default DashboardRouter;