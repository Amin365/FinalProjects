import express from "express";
import { protect } from "../middleware/auth.js";
import { requirePermission } from "../middleware/role.js";
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

const viewNotifications = [protect, requirePermission("View Notifications")];
const manageNotificationSettings = [protect, requirePermission("Manage Notification Settings")];
const manageAnnouncements = [protect, requirePermission("Manage Announcements")];

// Notification endpoints
NotificationRouter.get("/notifications", viewNotifications, listNotifications);
NotificationRouter.get("/notifications/stats", viewNotifications, getNotificationStats);
NotificationRouter.patch("/notifications/read-all", viewNotifications, markAllRead);
NotificationRouter.delete("/notifications/read", viewNotifications, deleteAllRead);
NotificationRouter.patch("/notifications/:id/read", viewNotifications, markOneRead);
NotificationRouter.delete("/notifications/:id", viewNotifications, deleteNotification);

// Push subscription: any authenticated user can register their own browser.
NotificationRouter.post("/push/subscribe", protect, subscribePush);

// Notification preferences
NotificationRouter.get("/notification-preferences", manageNotificationSettings, getMyPreferences);
NotificationRouter.patch("/notification-preferences", manageNotificationSettings, updateMyPreferences);
NotificationRouter.post("/notification-preferences/reset", manageNotificationSettings, resetMyPreferences);

// Announcements (admin only)
NotificationRouter.post("/announcements", manageAnnouncements, createAnnouncement);
NotificationRouter.get("/announcements/history", manageAnnouncements, getAnnouncementHistory);
NotificationRouter.get("/announcements/preview", manageAnnouncements, getAudiencePreview);

export default NotificationRouter;
