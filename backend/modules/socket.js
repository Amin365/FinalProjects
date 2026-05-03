import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import ChatMessage from "../models/ChatMessage.js";
import { canChatWith } from "../controller/ChatController.js";

const threadKeyFor = (a, b) => {
  const [x, y] = [String(a), String(b)].sort();
  return `${x}__${y}`;
};

const formatTime = (d) =>
  new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const getUserFromToken = async (token) => {
  if (!token) return null;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id)
    .select("-password")
    .populate("role", "role plural")
    .lean();
  return user || null;
};

export const createHttpServerWithSockets = (app, { allowedOrigins = [] } = {}) => {
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : true,
      credentials: true,
    },
  });

  const onlineCounts = new Map(); // userId -> count

  const setOnline = (userId, delta) => {
    const id = String(userId);
    const next = (onlineCounts.get(id) || 0) + delta;
    if (next <= 0) onlineCounts.delete(id);
    else onlineCounts.set(id, next);
    return onlineCounts.has(id);
  };

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const user = await getUserFromToken(token);
      if (!user?._id) return next(new Error("Unauthorized"));
      socket.user = user;
      return next();
    } catch (err) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const me = String(socket.user._id);
    socket.join(`user:${me}`);

    const isNowOnline = setOnline(me, 1);
    if (isNowOnline) {
      io.emit("presence:update", { userId: me, online: true });
    }

    // Send current online snapshot to the newly connected client
    // so they can mark green dots immediately (no need to wait for updates).
    socket.emit("presence:snapshot", { onlineUserIds: Array.from(onlineCounts.keys()) });

    socket.on("chat:typing", async ({ to, typing }) => {
      const peerId = String(to || "");
      if (!peerId) return;

      const access = await canChatWith(me, peerId);
      if (!access.allowed) return;

      io.to(`user:${peerId}`).emit("chat:typing", { from: me, typing: Boolean(typing) });
    });

    socket.on("chat:send", async ({ to, text, file }, ack) => {
      try {
        const peerId = String(to || "");
        const messageText = String(text || "").trim();

        const fileUrl = file?.url ? String(file.url).trim() : "";
        const fileName = file?.fileName ? String(file.fileName) : null;
        const fileMimeType = file?.mimeType ? String(file.mimeType) : null;
        const fileSize = typeof file?.size === "number" ? file.size : null;

        if (!peerId || (!messageText && !fileUrl)) {
          ack?.({ ok: false, message: "Invalid payload" });
          return;
        }

        const access = await canChatWith(me, peerId);
        if (!access.allowed) {
          ack?.({ ok: false, message: access.reason || "Forbidden" });
          return;
        }

        const msg = await ChatMessage.create({
          threadKey: threadKeyFor(me, peerId),
          from: me,
          to: peerId,
          text: messageText,
          fileUrl: fileUrl || null,
          fileName,
          fileMimeType,
          fileSize,
        });

        const payload = {
          id: String(msg._id),
          from: String(msg.from),
          to: String(msg.to),
          text: msg.text,
          fileUrl: msg.fileUrl || null,
          fileName: msg.fileName || null,
          fileMimeType: msg.fileMimeType || null,
          fileSize: typeof msg.fileSize === "number" ? msg.fileSize : null,
          time: formatTime(msg.createdAt),
          status: "sent",
          createdAt: msg.createdAt,
        };

        io.to(`user:${me}`).emit("chat:message", payload);
        io.to(`user:${peerId}`).emit("chat:message", payload);

        ack?.({ ok: true, data: payload });
      } catch (err) {
        ack?.({ ok: false, message: "Server error" });
      }
    });

    socket.on("disconnect", () => {
      const stillOnline = setOnline(me, -1);
      if (!stillOnline) {
        io.emit("presence:update", { userId: me, online: false, lastSeen: new Date().toISOString() });
      }
    });
  });

  return { server, io };
};
