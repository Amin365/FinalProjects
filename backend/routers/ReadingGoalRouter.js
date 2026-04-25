import express from "express";
import { protect } from "../middleware/auth.js";
import { apiLimiter } from "../utility/rateLimiter.js";
import { getMyGoals, createGoal, updateGoal, deleteGoal } from "../controller/ReadingGoalController.js";

const ReadingGoalRouter = express.Router();

ReadingGoalRouter.get("/users/me/goals", apiLimiter, protect, getMyGoals);
ReadingGoalRouter.post("/users/me/goals", apiLimiter, protect, createGoal);
ReadingGoalRouter.patch("/users/me/goals/:id", apiLimiter, protect, updateGoal);
ReadingGoalRouter.delete("/users/me/goals/:id", apiLimiter, protect, deleteGoal);

export default ReadingGoalRouter;
