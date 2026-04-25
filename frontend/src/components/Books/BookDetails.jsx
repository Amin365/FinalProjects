import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import {
  ArrowLeft,
  Trash2,
  Edit2,
  Book as BookIcon,
  Calendar,
  Clock,
  Loader2,
  X,
  ShieldCheck,
  History,
  BookMarked,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import BookModal from "./BookModel";
import { cn } from "@/lib/utils";

/* 

*/

/* Reusable Card like in EmployeeDetails */
const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl shadow-sm border border-slate-200/80 dark:border-gray-700/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm ${className}`}
  >
    {children}
  </div>
);

/* Small status badge matching EmployeeDetails styles */
const BadgeSmall = ({ status }) => {
  const styles = {
    available:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800",
    borrowed:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800",
    lost:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800",
    damaged:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800",
    archived:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide uppercase ${
        styles[status] ||
        "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
      }`}
    >
      {status}
    </span>
  );
};

/* Pill helper (small label with icon) */
const Pill = ({ icon: Icon, label }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
    {Icon && <Icon size={13} />} {label}
  </span>
);

/* Helpers */
const formatDate = (dateStr) => (dateStr ? new Date(dateStr).toLocaleDateString() : "N/A");

/* Quick Reserve Modal — inline on BookDetails */
const ReserveBookModal = ({ book, onClose, onSuccess }) => {
  const [memberCode, setMemberCode] = useState("");
  const [memberId, setMemberId] = useState(null);
  const [memberInfo, setMemberInfo] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);

  const lookupMember = async () => {
    if (!memberCode.trim()) return;
    setLookingUp(true);
    try {
      const r = await api.get(`/members/by-code/${encodeURIComponent(memberCode.trim())}`);
      const m = r.data?.data ?? r.data;
      setMemberId(m._id);
      setMemberInfo(m);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Member not found");
    } finally {
      setLookingUp(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const r = await api.post("/reservations", { book: book._id, member: memberId });
      return r.data;
    },
    onSuccess: (data) => {
      toast.success(`Reservation confirmed! Queue position: #${data?.position ?? "?"}`);
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to reserve book");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-slate-200 dark:border-gray-800">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BookMarked size={18} /> Reserve "{book.title}"
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xl">&times;</button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            This book is currently out of stock. Reserve your spot in the queue and you will be notified when it becomes available.
          </p>
          {!memberInfo ? (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">Enter Member ID</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="e.g. MBR123456AB"
                  value={memberCode}
                  onChange={(e) => setMemberCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && lookupMember()}
                />
                <button
                  onClick={lookupMember}
                  disabled={lookingUp || !memberCode.trim()}
                  className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
                >
                  {lookingUp ? <Loader2 size={16} className="animate-spin" /> : "Look up"}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-gray-700 p-3 bg-slate-50 dark:bg-gray-800 text-sm">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">
                    {memberInfo.full_name || [memberInfo.first_name, memberInfo.last_name].filter(Boolean).join(" ")}
                  </p>
                  <p className="text-xs text-slate-500">{memberInfo.code}</p>
                </div>
                <button onClick={() => { setMemberId(null); setMemberInfo(null); setMemberCode(""); }} className="text-xs text-slate-400 hover:text-red-500">Change</button>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button
              disabled={!memberId || mutation.isPending}
              onClick={() => mutation.mutate()}
              className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <BookMarked size={16} />}
              Confirm Reservation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("info"); // "info" | "history"
  const [showConditionMenu, setShowConditionMenu] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);


  useEffect(() => {
    try {
      setIsDark(Boolean(window?.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches));
    } catch {
      setIsDark(false);
    }
  }, []);

  // Fetch single book by id
  const {
    data: raw,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["book", id],
    queryFn: async () => {
      const res = await api.get(`/books/${id}`);
      // Support both shapes: { data: book } or direct book
      return res?.data?.data ?? res?.data;
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  });

  const book = raw ?? null;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (bookId) => {
      const res = await api.delete(`/books/${bookId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Book deleted");
      qc.invalidateQueries({ queryKey: ["books"] });
      navigate(-1);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to delete book";
      toast.error(msg);
    },
  });

  // Book history query
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["book-history", id],
    queryFn: async () => {
      const res = await api.get(`/books/${id}/history`);
      return res.data;
    },
    enabled: Boolean(id) && activeTab === "history",
    staleTime: 30_000,
  });

  // Book condition mutation
  const conditionMutation = useMutation({
    mutationFn: async (status) => {
      const res = await api.patch(`/books/${id}/condition`, { status });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Book condition updated");
      qc.invalidateQueries({ queryKey: ["book", id] });
      qc.invalidateQueries({ queryKey: ["books"] });
      setShowConditionMenu(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to update condition");
    },
  });

  const handleDeleteConfirm = async () => {
    if (!book?._id && !book?.id) return;
    setIsOperationLoading(true);
    try {
      await deleteMutation.mutateAsync(book._id);
    } finally {
      setIsOperationLoading(false);
      setIsDeleteOpen(false);
    }
  };

 const handleEdit = () => {
  setIsEditOpen(true);
};

 
  const meta = useMemo(() => {
    if (!book) return [];
    return [
      { label: "ISBN", value: book.isbn || "N/A" },
      { label: "Type", value: book.BookType || "N/A" },
      { label: "Published", value: formatDate(book.publishedDate) },
      { label: "Created", value: formatDate(book.createdAt) },
      { label: "Updated", value: formatDate(book.updatedAt) },
    ];
  }, [book]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-600 dark:text-slate-300">
        Loading book…
      </div>
    );
  }

  if (isError || !book) {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-300">
        Error: {error?.response?.data?.message || error?.message || "Book not found"}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300 pb-14 relative px-2 sm:px-0">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 border border-transparent hover:border-slate-200 dark:hover:border-gray-700 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-gray-300" />
        </button>

        <div className="flex-1">
          <h1 className="text-base md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Book Details
            {book?.status === "borrowed" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700 uppercase tracking-wide">
                <ShieldCheck size={12} /> Borrowed
              </span>
            )}
            {["lost", "damaged", "archived"].includes(book?.status) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700 uppercase tracking-wide">
                <AlertTriangle size={12} /> {book.status}
              </span>
            )}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Book ID: #{book._id} · ISBN: <span className="font-semibold">{book.isbn ?? "N/A"}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={() => setIsDeleteOpen(true)}
            disabled={isOperationLoading}
            className="px-3 py-1.5 md:px-4 md:py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-xs md:text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 border border-red-100 dark:border-red-900/40"
          >
            <Trash2 size={16} /> Delete
          </button>
          <button
            onClick={handleEdit}
            className="px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl flex items-center gap-2 text-xs md:text-sm font-semibold shadow-md shadow-orange-300/40 dark:shadow-none transition-colors"
          >
            <Edit2 size={16} /> Edit Details
          </button>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="mb-6 relative overflow-hidden border-0 ring-1 ring-slate-200 dark:ring-gray-700">
        <div
          className={`h-32 bg-gradient-to-r ${
            isDark ? "from-slate-700 via-slate-800 to-slate-900" : "from-orange-500 via-orange-500 to-orange-700"
          }`}
        />
        <div className="px-6 md:px-8 pb-7">
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 gap-5 md:gap-6">
            <div
              className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-white dark:border-gray-900 shadow-xl flex items-center justify-center text-3xl md:text-4xl font-bold text-white ${
                book.book_picture ? "bg-transparent" : "bg-slate-700"
              } overflow-hidden`}
            >
              {book.book_picture ? (
                <img src={book.book_picture} alt={book.title} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                book.title?.[0] ?? <BookIcon />
              )}
            </div>

            <div className="flex-1 mt-2">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                {book.title}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 md:gap-3 text-slate-600 dark:text-gray-400 text-xs md:text-sm">
                <Pill icon={BookIcon} label={book.BookType || "Book"} />
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-gray-600" />
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} /> {formatDate(book.publishedDate)}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-gray-600" />
                <BadgeSmall status={book.status || "available"} />
              </div>
            </div>

            <div className="mb-2 flex flex-col items-stretch gap-2">
              {/* Reserve button when borrowed/out of stock */}
              {(book.availableCopies || 0) === 0 && !["lost", "damaged", "archived"].includes(book.status) && (
                <button
                  onClick={() => setShowReserveModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-medium transition-colors"
                >
                  <BookMarked size={16} /> Reserve
                </button>
              )}
              <button
                onClick={() => qc.invalidateQueries({ queryKey: ["book", id] })}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800 text-xs md:text-sm font-medium transition-colors"
              >
                <Loader2 size={16} /> Refresh
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-gray-700">
        {[
          { key: "info", label: "Book Info", icon: BookIcon },
          { key: "history", label: "Borrow History", icon: History },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === key
                ? "border-orange-500 text-orange-600 dark:text-orange-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <BookIcon className="text-orange-500" size={20} /> Book Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6 text-sm">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Title</label>
                  <p className="text-slate-800 dark:text-gray-100 font-medium mt-1">{book.title}</p>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Author</label>
                  <p className="text-slate-800 dark:text-gray-100 font-medium mt-1">{book.author || "N/A"}</p>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ISBN</label>
                  <p className="text-slate-800 dark:text-gray-100 font-medium mt-1">{book.isbn}</p>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Book Type</label>
                  <p className="text-slate-800 dark:text-gray-100 font-medium mt-1">{book.BookType || "N/A"}</p>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Copies</label>
                  <p className="text-slate-800 dark:text-gray-100 font-medium mt-1">{book.totalCopies ?? 1}</p>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Available Copies</label>
                  <p className="text-slate-800 dark:text-gray-100 font-medium mt-1">{book.availableCopies ?? 0}</p>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</label>
                  <div className="mt-1 flex items-center gap-2">
                    <BadgeSmall status={book.status || "available"} />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cover Image</label>
                  {book.book_picture ? (
                    <div className="mt-2">
                      <img src={book.book_picture} alt={book.title} className="w-40 h-auto rounded-md border" />
                    </div>
                  ) : (
                    <p className="mt-2 text-slate-500 dark:text-slate-400">No cover image provided.</p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="text-indigo-500" size={18} /> Metadata
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {meta.map((m) => (
                  <div key={m.label}>
                    <label className="text-[11px] text-slate-400 uppercase tracking-wider">{m.label}</label>
                    <div className="font-medium text-slate-800 dark:text-slate-200 mt-1">{m.value}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                Quick Actions
              </h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => qc.invalidateQueries({ queryKey: ["books"] })}
                  className="px-3 py-2 rounded-xl border text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Refresh list cache
                </button>
              </div>
            </Card>

            {/* Book Condition Management */}
            <Card className="p-6">
              <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle size={14} /> Book Condition
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Mark book as lost, damaged, or archived to remove it from active circulation.
              </p>
              <div className="flex flex-col gap-2">
                {["available", "lost", "damaged", "archived"].map((s) => (
                  <button
                    key={s}
                    disabled={book.status === s || conditionMutation.isPending}
                    onClick={() => conditionMutation.mutate(s)}
                    className={cn(
                      "px-3 py-2 rounded-xl border text-xs font-medium transition-colors capitalize",
                      book.status === s
                        ? "bg-slate-100 dark:bg-gray-700 text-slate-400 cursor-default"
                        : s === "available"
                        ? "hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                        : s === "lost"
                        ? "hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                        : s === "damaged"
                        ? "hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {conditionMutation.isPending && conditionMutation.variables === s ? (
                      <Loader2 size={12} className="animate-spin inline mr-1" />
                    ) : null}
                    Mark as {s}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          {historyLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin mx-auto text-slate-400" size={24} />
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Borrows", value: historyData?.total ?? 0 },
                  { label: "Last Issued", value: historyData?.last_issued ? new Date(historyData.last_issued).toLocaleDateString() : "—" },
                  { label: "Last Returned", value: historyData?.last_returned ? new Date(historyData.last_returned).toLocaleDateString() : "—" },
                  { label: "Available Copies", value: book.availableCopies ?? 0 },
                ].map((s) => (
                  <Card key={s.label} className="p-4 text-center">
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{s.value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
                  </Card>
                ))}
              </div>

              {/* History table */}
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700">
                      <tr>
                        <th className="p-4 font-semibold text-slate-500 dark:text-white">Member</th>
                        <th className="p-4 font-semibold text-slate-500 dark:text-white">Issue Date</th>
                        <th className="p-4 font-semibold text-slate-500 dark:text-white">Return Date</th>
                        <th className="p-4 font-semibold text-slate-500 dark:text-white">Returned At</th>
                        <th className="p-4 font-semibold text-slate-500 dark:text-white">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                      {(historyData?.data ?? []).map((issue) => {
                        const name = issue.member?.full_name ||
                          [issue.member?.first_name, issue.member?.last_name].filter(Boolean).join(" ");
                        return (
                          <tr key={issue._id} className="hover:bg-slate-50 dark:hover:bg-gray-800">
                            <td className="p-4">
                              <div className="font-medium text-slate-800 dark:text-white">{name || "—"}</div>
                              <div className="text-xs text-slate-500">{issue.member?.code || ""}</div>
                            </td>
                            <td className="p-4 text-slate-600 dark:text-slate-300">{formatDate(issue.issueDate)}</td>
                            <td className="p-4 text-slate-600 dark:text-slate-300">{formatDate(issue.returnDate)}</td>
                            <td className="p-4 text-slate-600 dark:text-slate-300">{issue.returnedAt ? formatDate(issue.returnedAt) : "—"}</td>
                            <td className="p-4">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                                issue.status === "Issued" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                issue.status === "Returned" ? "bg-green-50 text-green-700 border-green-200" :
                                "bg-red-50 text-red-700 border-red-200"
                              )}>
                                {issue.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {(historyData?.data ?? []).length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-slate-400 dark:text-gray-400">
                            No borrow history for this book yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-slate-200 dark:border-gray-800">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-base md:text-lg font-bold ${"text-slate-800 dark:text-white"}`}>
                  Delete Book
                </h3>
                <button onClick={() => setIsDeleteOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Are you sure you want to permanently delete "<strong>{book.title}</strong>"? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  className="px-4 py-2 text-xs md:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-xl font-medium border border-slate-200 dark:border-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isOperationLoading}
                  className={`px-4 py-2 text-xs md:text-sm text-white rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-60 bg-red-600 hover:bg-red-700`}
                >
                  {isOperationLoading ? <Loader2 size={16} className="animate-spin" /> : "Delete Permanently"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Reserve Modal */}
      {showReserveModal && (
        <ReserveBookModal
          book={book}
          onClose={() => setShowReserveModal(false)}
          onSuccess={() => {
            setShowReserveModal(false);
            qc.invalidateQueries({ queryKey: ["reservations"] });
          }}
        />
      )}

      <BookModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        initialData={book}
        mode="edit"
        onSuccess={(updated) => {
          setIsEditOpen(false);
          qc.invalidateQueries({ queryKey: ["book", book._id ?? book.id] });
        }}
      />
    </div>
  );
}
