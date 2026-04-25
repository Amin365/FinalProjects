import express from "express"
import dotenv from "dotenv"
import mongoose from "mongoose"
import BookRouter from "./routers/BookRouter.js"
import { ErrorHandle } from "./middleware/ErorHandle.js"
import { NotFound } from "./middleware/NotFound.js"
import seedAllModules from "./seeds/index.js"
import AuthRouter from "./routers/AuthRouter.js"
import cors from 'cors'
import RoleRouter from "./routers/RoleRouter.js"
import MemberRouter from "./routers/MemberRouter.js"

import NotificationRouter from "./routers/NotificationRouter.js"
import { startIssueDueScheduler } from "./modules/issueDueScheduler.js"
import issueRouter from "./routers/IssueRouter.js"
import issueRequestRouter from "./routers/IssueRequestRouter.js"
import reservationRouter from "./routers/ReservationRouter.js"

import UserRouter from "./routers/UserRouter.js"
import Programrouter from "./routers/ProgramRouter.js"

import helmet from "helmet";
import {xss} from "express-xss-sanitizer";
import hpp from 'hpp'
import cookieParser from "cookie-parser";

import path from 'path'
import { fileURLToPath } from "url";  

import { startDailyReportMissingScheduler } from "./modules/notifyMissingDailyReport.js"
import DashboardRouter from "./routers/DashboardRouter.js"


import { startScheduledReporting } from "./modules/scheduledReporting.js";
import ResourceRouter from './routers/ResourceRouter.js';
import { startScheduledPublishing } from "./modules/scheduledPublishing.js";
// Phase 8 - Admin Governance and Safety
import AuditLogRouter from './routers/AuditLogRouter.js';
import SystemHealthRouter from './routers/SystemHealthRouter.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });
const app = express()
const PORT = process.env.PORT || 5000
app.set("trust proxy", 1);
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



const allowedOrigins = [
  "http://localhost:5173",
  "https://jjureadingclub.com" 
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Postman, server-side requests

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com", "https://i.pravatar.cc"],
        connectSrc: ["'self'", "https://jjureadingclub.com"], // allow API calls
        frameAncestors: ["'none'"],
      },
    },
  })
);




// after express app created, before routes:



app.use((req, res, next) => {
  if (req.path.startsWith("/api/blogposts")) return next();
  return xss()(req, res, next);
});
app.use(hpp());




app.use('/api',AuthRouter)

app.use("/api", BookRouter);
// Register moderator routes before member routes so static paths like
// `/api/members/unassigned` handled by ModeratorRouter instead of being
// captured by MemberRouter's dynamic `:id` param.

app.use("/api",MemberRouter);
app.use("/api", RoleRouter);
app.use('/api',issueRouter)
app.use('/api',issueRequestRouter)
app.use('/api/issue-requests', issueRequestRouter)
app.use('/api',reservationRouter)

app.use('/api',NotificationRouter)
app.use('/api',UserRouter)


app.use('/api',DashboardRouter)

app.use('/api', ResourceRouter);
//  - Admin Governance and Safety
app.use('/api', AuditLogRouter);
app.use('/api', SystemHealthRouter);
app.use('/api/programs',Programrouter)

app.get("/api/health/email", (req, res) => {
  return res.json({
    nodeEnv: process.env.NODE_ENV || null,
    resendKey: Boolean(process.env.RESEND_API_KEY),
    emailFrom: process.env.EMAIL_FROM || null,
    emailFromName: process.env.EMAIL_FROM_NAME || null,
    appUrl: process.env.APP_URL || null,
  });
});

app.post("/sync-and-migration", async (req, res) => {
  try {
 
    await mongoose.connection.db.listCollections().toArray();
    await mongoose.syncIndexes?.();

    // Run all seeders
    await seedAllModules();

    return res.json({
      success: true,
      message: "MongoDB migration & seeding completed successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: `Migration failed: ${error.message}`,
    });
  }
});



app.post("/db-alter/sync-seed", async (req, res) => {
  try {
    await seedAllModules();

    return res.json({
      success: true,
      message: "MongoDB seeding completed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: `Seeding failed: ${error.message}`,
    });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get(/.*/, (req, res, next) => {
    if (req.path === '/api' || req.path.startsWith('/api/')) {
      return next();
    }

    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}



app.use(NotFound)
app.use(ErrorHandle);

mongoose.connect(process.env.NODE_ENV === 'production' ? process.env.Mongo_atlas : process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully')
    // start background scheduler for due/overdue notifications
    startIssueDueScheduler();
    startDailyReportMissingScheduler();
    startScheduledReporting();
    startScheduledPublishing();
  })
  .catch((error) => console.log('❌ MongoDB Connection Error:', error));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
