import express from "express";
import { protect } from "../middleware/auth.js";
import { 
  listNotifications, 
  markAllRead, 
  markOneRead,
  getNotificationStats,
  deleteNotification,
  deleteAllRead,
} from "../controller/NotificationController.js";
import { subscribePush } from "../controller/PushNotifactions.js";
import {
  getMyPreferences,
  updateMyPreferences,
  resetMyPreferences,
} from "../controller/NotificationPreferencesController.js";
import {
  createAnnouncement,
  getAnnouncementHistory,
  getAudiencePreview,
} from "../controller/AnnouncementController.js";

const NotificationRouter = express.Router();

// Notification endpoints
NotificationRouter.get("/notifications", protect, listNotifications);
NotificationRouter.get("/notifications/stats", protect, getNotificationStats);
NotificationRouter.patch("/notifications/read-all", protect, markAllRead);
NotificationRouter.delete("/notifications/read", protect, deleteAllRead);
NotificationRouter.patch("/notifications/:id/read", protect, markOneRead);
NotificationRouter.delete("/notifications/:id", protect, deleteNotification);

// Push subscription
NotificationRouter.post("/push/subscribe", protect, subscribePush);

// Notification preferences
NotificationRouter.get("/notification-preferences", protect, getMyPreferences);
NotificationRouter.patch("/notification-preferences", protect, updateMyPreferences);
NotificationRouter.post("/notification-preferences/reset", protect, resetMyPreferences);

// Announcements (admin only)
NotificationRouter.post("/announcements", protect, createAnnouncement);
NotificationRouter.get("/announcements/history", protect, getAnnouncementHistory);
NotificationRouter.get("/announcements/preview", protect, getAudiencePreview);

export default NotificationRouter;
