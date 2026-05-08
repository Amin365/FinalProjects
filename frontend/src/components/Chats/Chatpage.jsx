
import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Search, Phone, Video, Info, Paperclip, Smile,
  Send, ArrowLeft, MoreHorizontal, Check, CheckCheck,
  X, ImageIcon, Download, FileText, ExternalLink,
} from "lucide-react";
import { io } from "socket.io-client";
import api from "@/app/api/apislice";

const getSocketUrl = () => {
  const base = String(api?.defaults?.baseURL || "");
  return base.replace(/\/api\/?$/, "");
};

/* 
   HELPERS
 */
const fmtTime = () => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const fmtBytes = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num) || num <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let v = num;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  const fixed = i === 0 ? 0 : v < 10 ? 1 : 0;
  return `${v.toFixed(fixed)} ${units[i]}`;
};

// Removed PDF inline preview logic
// const isLikelyPdf = (msg) => {
//   const mt = String(msg?.fileMimeType || "").toLowerCase();
//   if (mt === "application/pdf" || mt.endsWith("/pdf")) return true;
//   const name = String(msg?.fileName || "").toLowerCase();
//   return name.endsWith(".pdf");
// };

const downloadToDisk = async ({ url, fileName }) => {
  const abs = toAbsoluteUrl(url);
  const res = await fetch(abs);
  if (!res.ok) throw new Error("download failed");
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = fileName || "file";
  document.body.appendChild(a);
  a.click();
  a.remove();

  return { blobUrl };
};

const downloadedKeyFor = (msg) => {
  const url = String(msg?.fileUrl || "");
  if (!url) return null;
  return `chat:downloaded:${url}`;
};

const isLikelyImage = (msg) => {
  const mt = String(msg?.fileMimeType || "").toLowerCase();
  if (mt.startsWith("image/")) return true;
  const name = String(msg?.fileName || "").toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name);
};

const toAbsoluteUrl = (maybeUrl) => {
  const url = String(maybeUrl || "");
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const base = getSocketUrl();
  if (!base) return url;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
};

/* Avatar */
const Avatar = ({ initials, bg, color, size = 40, online = false }) => (
  <div className="relative shrink-0" style={{ width: size, height: size }}>
    <div className="w-full h-full rounded-full flex items-center justify-center font-semibold text-[13px]"
      style={{ background: bg, color, fontSize: size < 36 ? 10 : 13 }}>
      {initials}
    </div>
    {online && (
      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
    )}
  </div>
);

/* Typing dots */
const TypingDots = () => (
  <div className="flex items-center gap-1 px-3 py-2.5 bg-slate-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm w-fit">
    {[0, 150, 300].map(d => (
      <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"
        style={{ animationDelay: `${d}ms`, animationDuration: "0.9s" }} />
    ))}
  </div>
);

/* Message status icon */
const MsgStatus = ({ status }) => {
  if (status === "read")  return <CheckCheck size={13} className="text-blue-400" />;
  if (status === "sent")  return <Check size={13} className="text-slate-400" />;
  return null;
};

/* 
   CONTACT ITEM
 */
const ContactItem = ({ contact, active, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer mx-2 transition-colors duration-150
      ${active ? "bg-orange-50 dark:bg-orange-900/20" : "hover:bg-slate-100 dark:hover:bg-gray-800/60"}`}
  >
    <Avatar initials={contact.initials} bg={contact.bg} color={contact.color} size={44} online={contact.online} />
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <span className={`text-[13.5px] truncate ${contact.unread > 0 ? "font-bold text-slate-900 dark:text-white" : "font-semibold text-slate-800 dark:text-slate-100"}`}>
          {contact.name}
        </span>
        <span className="text-[11px] text-slate-400 shrink-0 ml-2">{contact.time}</span>
      </div>
      <div className="flex items-center justify-between mt-0.5">
        <span className={`text-[12.5px] truncate ${contact.unread > 0 ? "text-slate-700 dark:text-slate-200 font-medium" : "text-slate-400 dark:text-slate-500"} ${contact.isTyping ? "text-orange-500 italic" : ""}`}>
          {contact.lastMsg}
        </span>
        {contact.unread > 0 && (
          <span className="ml-2 min-w-[18px] h-[18px] rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shrink-0">
            {contact.unread}
          </span>
        )}
      </div>
    </div>
  </div>
);

/* 
   MESSAGE BUBBLE
 */
const MessageBubble = ({ msg, isMe, contact }) => {
  const [revealedUrl, setRevealedUrl] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    return () => {
      if (revealedUrl) URL.revokeObjectURL(revealedUrl);
    };
  }, [revealedUrl]);

  useEffect(() => {
    const key = downloadedKeyFor(msg);
    if (!key) return;
    try {
      const v = localStorage.getItem(key);
      if (v === "1") setIsDownloaded(true);
    } catch {
      // ignore
    }
  }, [msg?.fileUrl]);

  const handleDownload = async () => {
    if (!msg.fileUrl || downloading) return;
    setDownloading(true);
    try {
      const { blobUrl } = await downloadToDisk({ url: msg.fileUrl, fileName: msg.fileName });
      const key = downloadedKeyFor(msg);
      if (key) {
        try {
          localStorage.setItem(key, "1");
        } catch {
          // ignore
        }
      }

      setIsDownloaded(true);

      if (isLikelyImage(msg)) {
        // reveal in-session using local blob URL
        setRevealedUrl(blobUrl);
      } else {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
      }
    } catch (e) {
      // ignore
    } finally {
      setDownloading(false);
    }
  };

  const canOpenFile = Boolean(msg?.fileUrl) && (isMe || isDownloaded);
  const openUrl = msg?.fileUrl ? toAbsoluteUrl(msg.fileUrl) : "";

  return (
    <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      {!isMe && <Avatar initials={contact.initials} bg={contact.bg} color={contact.color} size={28} />}
      <div className={`flex flex-col gap-0.5 max-w-[68%] ${isMe ? "items-end" : "items-start"}`}>
        <div
          className={`px-3.5 py-2.5 text-[13.5px] leading-relaxed wrap-break-word
            ${isMe
              ? "bg-orange-500 text-white rounded-2xl rounded-br-sm"
              : "bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-white rounded-2xl rounded-bl-sm"
            }`}
        >
          {msg.text ? <div className={msg.fileUrl ? "mb-2" : ""}>{msg.text}</div> : null}

          {msg.fileUrl ? (
            isLikelyImage(msg) ? (
              <div className="flex flex-col gap-2">
                <div className="relative">
                  {canOpenFile ? (
                    <a href={openUrl} target="_blank" rel="noreferrer" className="block">
                      <img
                        src={revealedUrl || openUrl}
                        alt={msg.fileName || "image"}
                        className="max-w-[260px] w-full rounded-xl object-cover"
                      />
                    </a>
                  ) : (
                    <>
                      <img
                        src={openUrl}
                        alt={msg.fileName || "image"}
                        className="max-w-[260px] w-full rounded-xl object-cover blur-2xl"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={handleDownload}
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMe ? "bg-white/20 hover:bg-white/30 text-white" : "bg-white/80 hover:bg-white text-slate-800"}`}
                          title="Download"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className={`flex items-center gap-2 rounded-xl px-2.5 py-2 ${isMe ? "bg-white/15" : "bg-white dark:bg-gray-900/30"}`}>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12.5px] font-semibold truncate ${isMe ? "text-white" : "text-slate-900 dark:text-white"}`}>
                      {msg.fileName || "Image"}
                    </p>
                    <p className={`text-[11px] truncate ${isMe ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>
                      {fmtBytes(msg.fileSize) || msg.fileMimeType || ""}
                    </p>
                  </div>

                  {isMe ? (
                    <a
                      href={openUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isMe ? "bg-white/20 hover:bg-white/30 text-white" : "bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200"}`}
                      title="Open"
                    >
                      <ExternalLink size={16} />
                    </a>
                  ) : canOpenFile ? (
                    <a
                      href={openUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${"bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200"}`}
                      title="Open"
                    >
                      <ExternalLink size={16} />
                    </a>
                  ) : (
                    <button
                      onClick={handleDownload}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${"bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200"}`}
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${isMe ? "bg-white/15" : "bg-white dark:bg-gray-900/30"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isMe ? "bg-white/20" : "bg-slate-100 dark:bg-gray-800"}`}>
                  <FileText size={18} className={isMe ? "text-white" : "text-slate-500 dark:text-slate-300"} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-[12.5px] font-semibold truncate ${isMe ? "text-white" : "text-slate-900 dark:text-white"}`}>
                    {msg.fileName || "Document"}
                  </p>
                  <p className={`text-[11px] truncate ${isMe ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>
                    {fmtBytes(msg.fileSize) || msg.fileMimeType || ""}
                  </p>
                </div>

                {isMe ? (
                  <a
                    href={openUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${"bg-white/20 hover:bg-white/30 text-white"}`}
                    title="Open"
                  >
                    <ExternalLink size={16} />
                  </a>
                ) : canOpenFile ? (
                  <a
                    href={openUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${"bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200"}`}
                    title="Open"
                  >
                    <ExternalLink size={16} />
                  </a>
                ) : (
                  <button
                    onClick={handleDownload}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${"bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200"}`}
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                )}
              </div>
            )
          ) : null}

          {downloading ? (
            <div className={`mt-2 text-[11px] ${isMe ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>
              Downloading…
            </div>
          ) : null}
        </div>

        <div className={`flex items-center gap-1 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">{msg.time}</span>
          {isMe && <MsgStatus status={msg.status} />}
        </div>
      </div>
    </div>
  );
};

/* 
   MAIN CHAT PAGE
 */
export default function ChatPage() {
  const currentUser   = useSelector(s => s.auth.user);
  const token         = useSelector(s => s.auth.token);
  const [contacts,    setContacts]   = useState([]);
  const [active,      setActive]     = useState(null);
  const [messages,    setMessages]   = useState({});
  const [input,       setInput]      = useState("");
  const [search,      setSearch]     = useState("");
  const [showSidebar, setShowSidebar]= useState(true);
  const [peerTyping,  setPeerTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const socketRef      = useRef(null);
  const activeIdRef    = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef   = useRef(null);
  const imageInputRef  = useRef(null);

  useEffect(() => {
    activeIdRef.current = active?.id || null;
  }, [active?.id]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, []);

  /* scroll to bottom when messages change */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, active?.id, peerTyping]);

  /* load contacts */
  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/chats/contacts");
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        if (cancelled) return;
        setContacts(list);
        if (!active && list.length) setActive(list[0]);
      } catch (e) {
        // keep UI; just fail silently
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* socket connect */
  useEffect(() => {
    if (!token) return;

    const socket = io(getSocketUrl(), {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("presence:snapshot", ({ onlineUserIds }) => {
      const set = new Set((onlineUserIds || []).map((x) => String(x)));
      setContacts((prev) => prev.map((c) => (set.has(String(c.id)) ? { ...c, online: true } : c)));
    });

    socket.on("presence:update", ({ userId, online, lastSeen }) => {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === String(userId)
            ? { ...c, online: Boolean(online), lastSeen: lastSeen ? "just now" : c.lastSeen }
            : c
        )
      );
    });

    socket.on("chat:typing", ({ from, typing }) => {
      if (String(from) !== String(activeIdRef.current)) return;
      setPeerTyping(Boolean(typing));
      setContacts((prev) =>
        prev.map((c) => (c.id === String(from) ? { ...c, isTyping: Boolean(typing), lastMsg: typing ? "typing…" : c.lastMsg } : c))
      );
    });

    socket.on("chat:message", (msg) => {
      const meId = String(currentUser?._id || "");
      const fromId = String(msg?.from || "");
      const toId = String(msg?.to || "");
      if (!fromId || !toId) return;

      const activeId = String(activeIdRef.current || "");

      const peerId = fromId === meId ? toId : fromId;
      const fromSentinel = fromId === meId ? "me" : fromId;
      const mapped = {
        id: msg.id,
        from: fromSentinel,
        text: msg.text,
        fileUrl: msg.fileUrl || null,
        fileName: msg.fileName || null,
        fileMimeType: msg.fileMimeType || null,
        fileSize: typeof msg.fileSize === "number" ? msg.fileSize : null,
        time: msg.time || fmtTime(),
        status: fromId === meId ? (msg.status || "sent") : "read",
      };

      setMessages((prev) => {
        const thread = prev[peerId] || [];

        if (fromSentinel === "me") {
          const idx = [...thread]
            .reverse()
            .findIndex((m) => {
              if (m?.from !== "me") return false;
              if (m?.status !== "sent") return false;
              if (!String(m?.id || "").startsWith("m-")) return false;
              if (mapped.fileUrl) return m?.fileUrl === mapped.fileUrl;
              return m?.text === mapped.text;
            });
          if (idx !== -1) {
            const realIndex = thread.length - 1 - idx;
            const next = [...thread];
            next[realIndex] = {
              ...next[realIndex],
              id: mapped.id,
              time: mapped.time,
              status: mapped.status,
              fileUrl: mapped.fileUrl,
              fileName: mapped.fileName,
              fileMimeType: mapped.fileMimeType,
              fileSize: mapped.fileSize,
              text: mapped.text,
            };
            return { ...prev, [peerId]: next };
          }
        }

        return {
          ...prev,
          [peerId]: [...thread, mapped],
        };
      });

      setContacts((prev) =>
        prev.map((c) =>
          c.id === peerId
            ? {
                ...c,
                lastMsg: (() => {
                  const content = mapped.text || (mapped.fileUrl ? `File: ${mapped.fileName || "File"}` : "");
                  return fromId === meId ? `You: ${content}` : content;
                })(),
                time: "now",
                unread: fromId === meId ? 0 : (activeId === String(peerId) ? 0 : (c.unread || 0) + 1),
                isTyping: false,
              }
            : c
        )
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, currentUser?._id]);

  /* load messages for active */
  useEffect(() => {
    if (!token) return;
    if (!active?.id) return;
    if (messages[active.id]) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/chats/messages/${active.id}`, { params: { limit: 200 } });
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        if (cancelled) return;

        const meId = String(currentUser?._id || "");
        const mapped = list.map((m) => ({
          id: m.id,
          from: String(m.from) === meId ? "me" : String(m.from),
          text: m.text,
          fileUrl: m.fileUrl || null,
          fileName: m.fileName || null,
          fileMimeType: m.fileMimeType || null,
          fileSize: typeof m.fileSize === "number" ? m.fileSize : null,
          time: m.time,
          status: m.status || (String(m.from) === meId ? "sent" : undefined),
        }));

        setMessages((prev) => ({ ...prev, [active.id]: mapped }));
        setContacts((prev) => prev.map((c) => (c.id === active.id ? { ...c, unread: 0, isTyping: false } : c)));
      } catch (e) {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, active?.id]);

  const currentMessages = messages[active?.id] || [];

  const filteredContacts = contacts.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const onlineContacts = contacts.filter(c => c.online);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || !active) return;

    // Optimistic append
    const optimistic = { id: `m-${Date.now()}`, from: "me", text, time: fmtTime(), status: "sent" };
    setMessages((prev) => ({ ...prev, [active.id]: [...(prev[active.id] || []), optimistic] }));
    setContacts((prev) => prev.map((c) => (c.id === active.id ? { ...c, lastMsg: `You: ${text}`, time: "now", unread: 0 } : c)));
    setInput("");
    inputRef.current?.focus();

    socketRef.current?.emit("chat:send", { to: active.id, text }, (ack) => {
      if (!ack?.ok) return;
      // server echo will arrive via chat:message; keep optimistic message
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    socketRef.current?.emit("chat:typing", { to: active.id, typing: false });
  }, [input, active]);

  const uploadAndSendFile = useCallback(async (file) => {
    const peerId = String(activeIdRef.current || "");
    if (!file || !peerId) return;

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/chats/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = res.data?.data;
      if (!data?.url) return;

      const optimistic = {
        id: `m-${Date.now()}`,
        from: "me",
        text: "",
        fileUrl: data.url,
        fileName: data.fileName || file.name,
        fileMimeType: data.mimeType || file.type,
        fileSize: typeof data.size === "number" ? data.size : file.size,
        time: fmtTime(),
        status: "sent",
      };

      setMessages((prev) => ({ ...prev, [peerId]: [...(prev[peerId] || []), optimistic] }));
      setContacts((prev) =>
        prev.map((c) =>
          c.id === peerId
            ? { ...c, lastMsg: `You: File: ${optimistic.fileName || "File"}`, time: "now", unread: 0, isTyping: false }
            : c
        )
      );

      socketRef.current?.emit(
        "chat:send",
        {
          to: peerId,
          text: "",
          file: {
            url: data.url,
            fileName: optimistic.fileName,
            mimeType: optimistic.fileMimeType,
            size: optimistic.fileSize,
          },
        },
        () => {}
      );
    } catch (e) {
      // keep UI; fail silently
    }
  }, []);

  const selectContact = (contact) => {
    setActive(contact);
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread: 0 } : c));
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex bg-white dark:bg-gray-950 overflow-hidden">

      {/* ════════════════════════════════════════════════════
          SIDEBAR
      ════════════════════════════════════════════════════ */}
      <aside className={`
        flex flex-col w-full md:w-[320px] xl:w-[360px] border-r border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0
        ${showSidebar ? "flex" : "hidden md:flex"}
      `}>
        {/* Sidebar header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-800">
          <h1 className="text-[20px] font-extrabold text-slate-900 dark:text-white mb-3">Messages</h1>
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full h-9 pl-9 pr-4 rounded-full bg-slate-100 dark:bg-gray-800 border-0 text-[13px] text-slate-800 dark:text-gray-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 dark:focus:ring-orange-800/50 transition-all"
              placeholder="Search conversations…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Online users strip */}
        {!search && (
          <div className="px-5 py-3 border-b border-slate-100 dark:border-gray-800">
            <p className="text-[10.5px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              Active now · {onlineContacts.length}
            </p>
            <div className="flex gap-4 overflow-x-auto scrollbar-none pb-1">
              {onlineContacts.map(c => (
                <button key={c.id} onClick={() => selectContact(c)}
                  className="flex flex-col items-center gap-1.5 shrink-0 group">
                  <Avatar initials={c.initials} bg={c.bg} color={c.color} size={46} online />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 max-w-11 truncate text-center group-hover:text-orange-500 transition-colors">
                    {c.name.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto py-2 scrollbar-none">
          {filteredContacts.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-slate-400">No conversations found.</div>
          ) : (
            filteredContacts.map(c => (
              <ContactItem key={c.id} contact={c} active={active?.id === c.id} onClick={() => selectContact(c)} />
            ))
          )}
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════
          CHAT PANEL
      ════════════════════════════════════════════════════ */}
      <main className={`flex-1 flex flex-col min-w-0 ${!showSidebar || active ? "flex" : "hidden md:flex"}`}>
        {!active ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="w-20 h-20 rounded-3xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 flex items-center justify-center">
              <Send size={28} className="text-orange-400 rotate-45" />
            </div>
            <div>
              <h3 className="text-[17px] font-extrabold text-slate-800 dark:text-white mb-1.5">No chat selected</h3>
              <p className="text-[13px] text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
                Pick a conversation from the list to start messaging.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0">
              <button
                onClick={() => setShowSidebar(true)}
                className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft size={17} />
              </button>

              <Avatar initials={active.initials} bg={active.bg} color={active.color} size={40} online={active.online} />

              <div className="flex-1 min-w-0">
                <p className="text-[14.5px] font-extrabold text-slate-900 dark:text-white leading-tight truncate">{active.name}</p>
                <p className={`text-[12px] font-medium ${active.online ? "text-emerald-500" : "text-slate-400"}`}>
                  {peerTyping ? (
                    <span className="text-orange-500 italic">typing…</span>
                  ) : active.online ? "Active now" : `Last seen ${active.lastSeen}`}
                </p>
              </div>

              {/* <div className="flex items-center gap-1 shrink-0">
                {[
                  { icon: Phone, label: "Call"  },
                  { icon: Video, label: "Video" },
                  { icon: Info,  label: "Info"  },
                ].map(({ icon: Icon, label }) => (
                  <button key={label}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-orange-500 transition-all"
                    title={label}
                  >
                    <Icon size={17} />
                  </button>
                ))}
              </div> */}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 scrollbar-none bg-slate-50/40 dark:bg-gray-950">

              {/* Day separator */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-slate-200 dark:bg-gray-800" />
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Today</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-gray-800" />
              </div>

              {currentMessages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMe={msg.from === "me"}
                  contact={active}
                />
              ))}

              {/* Typing indicator */}
              {peerTyping && (
                <div className="flex items-end gap-2">
                  <Avatar initials={active.initials} bg={active.bg} color={active.color} size={28} />
                  <TypingDots />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0">
              {/* Attach */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all shrink-0"
              >
                <Paperclip size={17} />
              </button>
              {/* Image */}
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all shrink-0"
              >
                <ImageIcon size={17} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) uploadAndSendFile(f);
                }}
              />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) uploadAndSendFile(f);
                }}
              />

              {/* Text input */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => {
                    const next = e.target.value;
                    setInput(next);

                    const to = activeIdRef.current;
                    if (!to) return;

                    socketRef.current?.emit("chat:typing", { to, typing: Boolean(next.trim()) });

                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                      socketRef.current?.emit("chat:typing", { to, typing: false });
                    }, 1500);
                  }}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="Aa"
                  className="w-full h-10 px-4 rounded-full bg-slate-100 dark:bg-gray-800 border-0 text-[13.5px] text-slate-800 dark:text-gray-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 dark:focus:ring-orange-800/50 transition-all"
                />
              </div>

              {/* Emoji */}
              <button className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all shrink-0">
                <Smile size={17} />
              </button>

              {/* Send */}
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-200 dark:shadow-orange-900/30 transition-all hover:scale-[1.05] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Send size={16} className="translate-x-px -translate-y-px" />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}