import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import api from "@/app/api/apislice";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookMarked, CheckCircle2, XCircle, Loader2, PlusCircle } from "lucide-react";

/* ───────────────── helpers ───────────────── */
const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const statusClass = (s) => {
  switch ((s || "").toLowerCase()) {
    case "active":    return "bg-blue-100 text-blue-700 hover:bg-blue-100";
    case "fulfilled": return "bg-green-100 text-green-700 hover:bg-green-100";
    case "cancelled": return "bg-slate-100 text-slate-700 hover:bg-slate-100";
    case "expired":   return "bg-red-100 text-red-700 hover:bg-red-100";
    default:          return "bg-slate-100 text-slate-700 hover:bg-slate-100";
  }
};

/* ─────────────────── Create Reservation Modal ─────────────────── */
const CreateReservationModal = ({ onClose, onSuccess }) => {
  const [memberCode, setMemberCode] = useState("");
  const [memberId, setMemberId] = useState(null);
  const [memberInfo, setMemberInfo] = useState(null);
  const [selectedBook, setSelectedBook] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  const { data: booksData } = useQuery({
    queryKey: ["books", "unavailable"],
    queryFn: async () => {
      const r = await api.get("/books", { params: { limit: 500 } });
      return r.data?.data ?? r.data ?? [];
    },
    staleTime: 30_000,
  });

  const outOfStockBooks = useMemo(() => {
    const all = Array.isArray(booksData) ? booksData : [];
    // Only allow reservations for books that are currently borrowed (not lost/damaged/archived)
    return all.filter((b) => (b.availableCopies || 0) === 0 && !["lost", "damaged", "archived"].includes(b.status));
  }, [booksData]);

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

  const createMutation = useMutation({
    mutationFn: async () => {
      const r = await api.post("/reservations", { book: selectedBook, member: memberId });
      return r.data;
    },
    onSuccess: (data) => {
      toast.success(`Reservation confirmed! Queue position: #${data?.position ?? "?"}`);
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to create reservation");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 border border-slate-200 dark:border-gray-800">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BookMarked size={18} /> Reserve a Book
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xl">&times;</button>
          </div>

          {!memberInfo ? (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">Enter Member ID</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. MBR123456AB"
                  value={memberCode}
                  onChange={(e) => setMemberCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && lookupMember()}
                />
                <Button onClick={lookupMember} disabled={lookingUp || !memberCode.trim()}>
                  {lookingUp ? <Loader2 size={16} className="animate-spin" /> : "Look up"}
                </Button>
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

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
              Select Book (out-of-stock only) <span className="text-red-500">*</span>
            </label>
            <Select value={selectedBook} onValueChange={setSelectedBook}>
              <SelectTrigger>
                <SelectValue placeholder={outOfStockBooks.length === 0 ? "No out-of-stock books" : "Choose a book"} />
              </SelectTrigger>
              <SelectContent>
                {outOfStockBooks.map((b) => (
                  <SelectItem key={b._id} value={b._id}>
                    {b.title} — {b.author || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {outOfStockBooks.length === 0 && (
              <p className="text-xs text-slate-500">All books are currently available — no reservations needed.</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 dark:bg-orange-600"
              disabled={!memberId || !selectedBook || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Reserve
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────── Main Page ─────────────────── */
const ReservationsPage = () => {
  const qc = useQueryClient();
  const { user, token } = useSelector((s) => s.auth);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("Active");
  const [showCreate, setShowCreate] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: ["profile-role", token],
    queryFn: async () => { const r = await api.get("/auth/me"); return r.data; },
    enabled: !!token,
    staleTime: 60_000,
  });

  const roleName = useMemo(() => {
    const src = profileData?.user?.role || user?.role;
    if (!src) return "";
    return typeof src === "object" ? (src.role || src.name || "").toLowerCase() : String(src).toLowerCase();
  }, [profileData, user]);

  const canManage = roleName.includes("super") || roleName.includes("admin") || roleName.includes("moderator");

  const limit = 15;

  const { data, isLoading } = useQuery({
    queryKey: ["reservations", { page, limit, status: statusFilter !== "all" ? statusFilter : undefined }],
    queryFn: async ({ queryKey }) => {
      const [, params] = queryKey;
      const r = await api.get("/reservations", { params });
      return r.data ?? { data: [], total: 0, page: 1, totalPages: 0 };
    },
    staleTime: 20_000,
  });

  const items = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const cancelMutation = useMutation({
    mutationFn: (id) => api.patch(`/reservations/${id}/cancel`),
    onSuccess: () => {
      toast.success("Reservation cancelled");
      qc.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed"),
  });

  const fulfillMutation = useMutation({
    mutationFn: (id) => api.patch(`/reservations/${id}/fulfill`),
    onSuccess: () => {
      toast.success("Reservation fulfilled");
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed"),
  });

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <BookMarked size={28} /> Reservations
          </h1>
          <p className="text-sm mt-1 text-slate-500 dark:text-gray-300">
            Waitlist management — members reserve out-of-stock books.
          </p>
        </div>
        <Button className="dark:bg-orange-600" onClick={() => setShowCreate(true)}>
          <PlusCircle size={16} className="mr-2" /> New Reservation
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Fulfilled">Fulfilled</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="Expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-slate-500 dark:text-slate-400">{total} reservation{total !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <Card className="flex-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700">
              <tr>
                <th className="p-4 font-semibold text-slate-500 dark:text-white">Book</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-white">Member</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-white">Reserved On</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-white">Notified</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-white">Status</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-white text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
              {items.map((r) => {
                const memberName =
                  r.member?.full_name ||
                  [r.member?.first_name, r.member?.last_name].filter(Boolean).join(" ");
                return (
                  <tr key={r._id} className="group hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-800 dark:text-white">{r.book?.title || "—"}</div>
                      <div className="text-xs text-slate-500">{r.book?.isbn || ""}</div>
                    </td>
                    <td className="p-4 text-slate-700 dark:text-white">
                      <div className="font-medium">{memberName || "—"}</div>
                      <div className="text-xs text-slate-500">{r.member?.code || ""}</div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{formatDate(r.createdAt)}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {r.notifiedAt ? formatDate(r.notifiedAt) : <span className="text-slate-400 text-xs">Not yet</span>}
                    </td>
                    <td className="p-4">
                      <Badge className={cn(statusClass(r.status))}>{r.status}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {r.status === "Active" && (
                          <>
                            {canManage && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-600 hover:text-emerald-700"
                                onClick={() => fulfillMutation.mutate(r._id)}
                                disabled={fulfillMutation.isPending}
                              >
                                <CheckCircle2 size={14} className="mr-1" /> Fulfill
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => cancelMutation.mutate(r._id)}
                              disabled={cancelMutation.isPending}
                            >
                              <XCircle size={14} className="mr-1" /> Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {isLoading && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-slate-400" size={24} />
                  </td>
                </tr>
              )}
              {!isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 dark:text-gray-400">
                    No reservations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-4 border-t bg-card">
          <div className="text-sm text-muted-foreground">Showing {items.length} of {total}</div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="dark:bg-orange-600" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1 || isLoading}>Prev</Button>
            <span className="px-3 py-2 rounded-lg text-sm font-semibold bg-muted text-foreground">{page} / {totalPages}</span>
            <Button size="sm" className="dark:bg-orange-600" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages || isLoading}>Next</Button>
          </div>
        </div>
      </Card>

      {showCreate && (
        <CreateReservationModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["reservations"] });
            qc.invalidateQueries({ queryKey: ["notifications"] });
          }}
        />
      )}
    </div>
  );
};

export default ReservationsPage;
