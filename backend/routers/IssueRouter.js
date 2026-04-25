import express from 'express'
import { getIssues,IssueCreate,markIssueReturned,getMyIssues ,ReminderEmail} from '../controller/IssueController.js'
import { protect } from '../middleware/auth.js'

const issueRouter= express.Router()

issueRouter.post('/issue',IssueCreate)
issueRouter.get('/issue', protect, getIssues)
issueRouter.patch("/issue/:id/return", markIssueReturned);
issueRouter.get("/issues/my", protect, getMyIssues);
issueRouter.post("/issue/:id/send-reminder", ReminderEmail);

export default issueRouter;