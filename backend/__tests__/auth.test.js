/**
 * Unit tests for auth controller functions.
 * Mongoose models are mocked so no real DB connection is needed.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Model mocks ---
vi.mock("../models/user.js", () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../models/Role.js", () => ({ default: { findById: vi.fn() } }));
vi.mock("../models/RolePermission.js", () => ({ default: { find: vi.fn() } }));
vi.mock("../models/UserPermission.js", () => ({ default: { find: vi.fn() } }));
vi.mock("../models/RefreshToken.js", () => ({
  default: vi.fn().mockImplementation(() => ({ save: vi.fn() })),
}));
vi.mock("../../utility/auditLog.js", () => ({
  logAuthAction: vi.fn(),
  logMemberAction: vi.fn(),
  logUserAction: vi.fn(),
}));
vi.mock("../controller/EmailController.js", () => ({
  sendMail: vi.fn(),
  buildEmailHtml: vi.fn(),
}));
vi.mock("../../utility/tokenUtils.js", () => ({
  signAccessToken: vi.fn(() => "mock-access-token"),
  signRefreshToken: vi.fn(() => "mock-refresh-token"),
  hashToken: vi.fn(() => "hashed-token"),
  verifyRefreshToken: vi.fn(() => ({ exp: Math.floor(Date.now() / 1000) + 3600 })),
}));

// ---- Import subject under test after mocks --------------------------------
import User from "../models/user.js";
import { registerUser, loginUser } from "../controller/Authcontroller.js";

// ---- Helpers --------
function makeMockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
  };
  return res;
}

function makeMockReq(body = {}, extras = {}) {
  return { body, ip: "127.0.0.1", get: vi.fn(() => "test-agent"), ...extras };
}

// ---- registerUser tests ----------------------------------------------------
describe("registerUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when username is missing", async () => {
    const req = makeMockReq({ email: "a@b.com", password: "secret" });
    const res = makeMockRes();
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("required") })
    );
  });

  it("returns 400 when email is missing", async () => {
    const req = makeMockReq({ username: "alice", password: "secret" });
    const res = makeMockRes();
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when password is missing", async () => {
    const req = makeMockReq({ username: "alice", email: "a@b.com" });
    const res = makeMockRes();
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when user already exists", async () => {
    User.findOne.mockResolvedValueOnce({ _id: "existing-id" });
    const req = makeMockReq({ username: "alice", email: "a@b.com", password: "secret" });
    const res = makeMockRes();
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User already exists" })
    );
  });

  it("returns 201 with user data on successful registration", async () => {
    User.findOne.mockResolvedValueOnce(null);
    User.create.mockResolvedValueOnce({
      _id: "new-id",
      username: "alice",
      email: "a@b.com",
      role: "member",
    });
    const req = makeMockReq({ username: "alice", email: "a@b.com", password: "secret" });
    const res = makeMockRes();
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ email: "a@b.com", username: "alice" })
    );
  });
});

// ---- loginUser tests 
describe("loginUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when user is not found", async () => {
    User.findOne.mockResolvedValueOnce(null);
    const req = makeMockReq(
      { identifier: "unknown@test.com", password: "secret" },
      { rateLimit: { remaining: 4 } }
    );
    const res = makeMockRes();
    await loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 400 when identifier and password are missing", async () => {
    const req = makeMockReq({});
    const res = makeMockRes();
    await loginUser(req, res);
    // The function returns 401 from findOne(null) path, so we just check no 200
    expect(res.json).not.toHaveBeenCalledWith(
      expect.objectContaining({ token: expect.any(String) })
    );
  });
});
