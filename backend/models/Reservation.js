import mongoose from "mongoose";

const ReservationSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["Active", "Fulfilled", "Cancelled", "Expired"],
      default: "Active",
    },
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for querying the queue efficiently
ReservationSchema.index({ book: 1, status: 1, createdAt: 1 });
ReservationSchema.index({ member: 1, status: 1 });

const Reservation = mongoose.model("Reservation", ReservationSchema);
export default Reservation;
