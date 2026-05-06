import express from 'express'
import { getIssues,IssueCreate,markIssueReturned,getMyIssues ,ReminderEmail} from '../controller/IssueController.js'
import { protect } from '../middleware/auth.js'
import { requirePermission } from '../middleware/role.js'

const issueRouter= express.Router()

const manageIssues = [protect, requirePermission("Manage Issues")];

issueRouter.post('/issue', manageIssues, IssueCreate)
issueRouter.get('/issue', manageIssues, getIssues)
issueRouter.patch("/issue/:id/return", manageIssues, markIssueReturned);
issueRouter.get("/issues/my", protect, getMyIssues);
issueRouter.post("/issue/:id/send-reminder", manageIssues, ReminderEmail);

export default issueRouter;