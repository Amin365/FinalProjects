import express from "express";
import {
  createIssueRequest,
  getIssueRequests,
  approveIssueRequest,
  rejectIssueRequest,
  cancelIssueRequest,
  convertToIssue,
} from "../controller/IssueRequestController.js";
import { protect } from "../middleware/auth.js";
import { requirePermission } from "../middleware/role.js";
import { apiLimiter } from "../utility/rateLimiter.js";

const issueRequestRouter = express.Router();

const manageIssues = [protect, requirePermission("Manage Issues")];

issueRequestRouter.post(["/issue-requests", "/"], apiLimiter, protect, createIssueRequest);
issueRequestRouter.get(["/issue-requests", "/"], apiLimiter, protect, getIssueRequests);
issueRequestRouter.patch(["/issue-requests/:id/approve", "/:id/approve"], apiLimiter, manageIssues, approveIssueRequest);
issueRequestRouter.patch(["/issue-requests/:id/reject", "/:id/reject"], apiLimiter, manageIssues, rejectIssueRequest);
issueRequestRouter.patch(["/issue-requests/:id/cancel", "/:id/cancel"], apiLimiter, protect, cancelIssueRequest);
issueRequestRouter.patch(["/issue-requests/:id/issue", "/:id/issue"], apiLimiter, manageIssues, convertToIssue);

export default issueRequestRouter;
