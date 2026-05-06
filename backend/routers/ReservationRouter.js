import express from "express";
import {
  createReservation,
  getReservations,
  getBookQueue,
  cancelReservation,
  fulfillReservation,
} from "../controller/ReservationController.js";
import { protect } from "../middleware/auth.js";
import { requirePermission } from "../middleware/role.js";
import { apiLimiter } from "../utility/rateLimiter.js";

const reservationRouter = express.Router();

const manageReservations = [protect, requirePermission("Manage Reservations")];

reservationRouter.post("/reservations", apiLimiter, protect, createReservation);
reservationRouter.get("/reservations", apiLimiter, manageReservations, getReservations);
reservationRouter.get("/reservations/book/:bookId", apiLimiter, manageReservations, getBookQueue);
reservationRouter.patch("/reservations/:id/cancel", apiLimiter, protect, cancelReservation);
reservationRouter.patch("/reservations/:id/fulfill", apiLimiter, manageReservations, fulfillReservation);

export default reservationRouter;
