/**
 * Unit tests for ReservationController validation logic.
 * All DB models are mocked – no real database connection required.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../models/Reservation.js", () => ({
  default: {
    findOne: vi.fn(),
    countDocuments: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../models/Books.js", () => ({
  default: { findById: vi.fn() },
}));

vi.mock("../models/Members.js", () => ({
  default: { findById: vi.fn() },
}));

vi.mock("../models/user.js", () => ({
  default: { findOne: vi.fn() },
}));

vi.mock("../models/Notification.js", () => ({
  default: { create: vi.fn() },
}));

import Reservation from "../models/Reservation.js";
import Book from "../models/Books.js";
import Member from "../models/Members.js";
import { createReservation } from "../controller/ReservationController.js";

function makeMockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

function makeMockReq(body = {}, user = null) {
  return { body, user };
}

const VALID_BOOK_ID = "000000000000000000000001";
const VALID_MEMBER_ID = "000000000000000000000002";

describe("createReservation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when book is missing", async () => {
    const req = makeMockReq({ member: VALID_MEMBER_ID });
    const res = makeMockRes();
    const next = vi.fn();
    await createReservation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("required") })
    );
  });

  it("returns 400 when member is missing", async () => {
    const req = makeMockReq({ book: VALID_BOOK_ID });
    const res = makeMockRes();
    const next = vi.fn();
    await createReservation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when book id is invalid ObjectId", async () => {
    const req = makeMockReq({ book: "bad-id", member: VALID_MEMBER_ID });
    const res = makeMockRes();
    const next = vi.fn();
    await createReservation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid book id" })
    );
  });

  it("returns 400 when member id is invalid ObjectId", async () => {
    const req = makeMockReq({ book: VALID_BOOK_ID, member: "bad-id" });
    const res = makeMockRes();
    const next = vi.fn();
    await createReservation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid member id" })
    );
  });

  it("returns 404 when book is not found", async () => {
    Book.findById.mockReturnValue({ lean: () => ({ exec: () => Promise.resolve(null) }) });
    Member.findById.mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve({ _id: VALID_MEMBER_ID }) }),
    });
    const req = makeMockReq({ book: VALID_BOOK_ID, member: VALID_MEMBER_ID });
    const res = makeMockRes();
    const next = vi.fn();
    await createReservation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Book not found" })
    );
  });

  it("returns 404 when member is not found", async () => {
    Book.findById.mockReturnValue({
      lean: () => ({
        exec: () =>
          Promise.resolve({ _id: VALID_BOOK_ID, title: "Test Book", availableCopies: 0 }),
      }),
    });
    Member.findById.mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve(null) }),
    });
    const req = makeMockReq({ book: VALID_BOOK_ID, member: VALID_MEMBER_ID });
    const res = makeMockRes();
    const next = vi.fn();
    await createReservation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Member not found" })
    );
  });

  it("returns 409 when book has available copies", async () => {
    Book.findById.mockReturnValue({
      lean: () => ({
        exec: () =>
          Promise.resolve({ _id: VALID_BOOK_ID, title: "Test Book", availableCopies: 2 }),
      }),
    });
    Member.findById.mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve({ _id: VALID_MEMBER_ID }) }),
    });
    const req = makeMockReq({ book: VALID_BOOK_ID, member: VALID_MEMBER_ID });
    const res = makeMockRes();
    const next = vi.fn();
    await createReservation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("available copies") })
    );
  });

  it("returns 409 when member already has an active reservation", async () => {
    Book.findById.mockReturnValue({
      lean: () => ({
        exec: () =>
          Promise.resolve({ _id: VALID_BOOK_ID, title: "Test Book", availableCopies: 0 }),
      }),
    });
    Member.findById.mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve({ _id: VALID_MEMBER_ID }) }),
    });
    Reservation.findOne.mockReturnValue({
      lean: () => Promise.resolve({ _id: "existing-reservation" }),
    });
    const req = makeMockReq({ book: VALID_BOOK_ID, member: VALID_MEMBER_ID });
    const res = makeMockRes();
    const next = vi.fn();
    await createReservation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("active reservation") })
    );
  });
});
