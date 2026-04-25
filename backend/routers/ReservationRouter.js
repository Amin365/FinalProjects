import express from "express";
import {
  createReservation,
  getReservations,
  getBookQueue,
  cancelReservation,
  fulfillReservation,
} from "../controller/ReservationController.js";
import { protect } from "../middleware/auth.js";
import { apiLimiter } from "../utility/rateLimiter.js";

const reservationRouter = express.Router();

reservationRouter.post("/reservations", apiLimiter, protect, createReservation);
reservationRouter.get("/reservations", apiLimiter, protect, getReservations);
reservationRouter.get("/reservations/book/:bookId", apiLimiter, protect, getBookQueue);
reservationRouter.patch("/reservations/:id/cancel", apiLimiter, protect, cancelReservation);
reservationRouter.patch("/reservations/:id/fulfill", apiLimiter, protect, fulfillReservation);

export default reservationRouter;
