import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  Flame,
  AlertTriangle,
  FileText,
  Star,
  Plus,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import { toast } from "sonner";
import { useSelector } from "react-redux";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";

const toISODate = (d) => new Date(d).toISOString().slice(0, 10);

const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button key={star} type="button" onClick={() => onChange(star)} className="focus:outline-none">
        <Star className={`w-6 h-6 ${star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
      </button>
    ))}
  </div>
);

const getReportStatusColor = (status) => {
  switch (status) {
    case "Approved":
      return "bg-green-100 text-green-700 hover:bg-green-100";
    case "Pending":
      return "bg-amber-100 text-amber-700 hover:bg-amber-100";
    case "Needs Improvement":
      return "bg-red-100 text-red-700 hover:bg-red-100";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function DailyReadingReport() {
  const qc = useQueryClient();
  const authUser = useSelector((s) => s.auth.user);

  const [selectedBookId, setSelectedBookId] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);

  // modal fields
  const [readingDate, setReadingDate] = useState("");
  const [pagesFrom, setPagesFrom] = useState("");
  const [pagesTo, setPagesTo] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [summary, setSummary] = useState("");
  const [rating, setRating] = useState(0);

  const todayISO = toISODate(new Date());

  const [restoreCount, setRestoreCount] = useState(0);
  const [restoredForDate, setRestoredForDate] = useState("");

  // 48 hours: today + yesterday only
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const minAllowedDate = toISODate(yesterday);
  const maxAllowedDate = toISODate(today);

  // ---- issued books (from /issues/my) ----
  const { data: issuesResp, isLoading: booksLoading } = useQuery({
    queryKey: ["issues", "my", "daily-report"],
    queryFn: async () => {
      const res = await api.get("/issues/my");
      return res.data;
    },
    staleTime: 30_000,
  });

  const issuedBooks = useMemo(() => {
    const issues = issuesResp?.data ?? [];
    const books = issues.map((it) => it.book).filter(Boolean);

    const map = new Map();
    for (const b of books) map.set(b._id, b);
    return Array.from(map.values());
  }, [issuesResp]);

  useEffect(() => {
    if (!selectedBookId && issuedBooks.length) setSelectedBookId(issuedBooks[0]._id);
  }, [issuedBooks, selectedBookId]);

  const selectedBook = useMemo(
    () => issuedBooks.find((b) => b._id === selectedBookId) || null,
    [issuedBooks, selectedBookId]
  );

  // ---- reports ----
  const { data: reportsResp, isLoading: reportsLoading } = useQuery({
    queryKey: ["daily-reports", selectedBookId],
    enabled: Boolean(selectedBookId),
    queryFn: async () => {
      const res = await api.get("/daily-reports", {
        params: { book: selectedBookId, limit: 100 },
      });
      return res.data;
    },
    staleTime: 15_000,
  });

  const reports = useMemo(() => {
    const arr = reportsResp?.data ?? [];
    return arr
      .slice()
      .sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime());
  }, [reportsResp]);

  const lastThree = reports.slice(0, 3);

  // NEW FEATURE: compute next start page (first report => 1, else last pagesTo + 1)
  const nextPagesFrom = useMemo(() => {
    if (!reports.length) return 1;
    const lastPagesTo = Math.max(...reports.map((r) => Number(r.pagesTo || 0)));
    return lastPagesTo + 1;
  }, [reports]);

  // NEW FEATURE: when modal opens, auto-fill pagesFrom and lock it
  useEffect(() => {
    if (!isCreateOpen) return;
    setPagesFrom(String(nextPagesFrom));
  }, [isCreateOpen, nextPagesFrom]);

  // ---- progress (based on max pagesTo from reports) ----
  const currentPage = useMemo(() => {
    if (!reports.length) return 0;
    return reports.reduce((mx, r) => Math.max(mx, Number(r.pagesTo || 0)), 0);
  }, [reports]);

  // NOTE: Your Book model doesn't have totalPages, so this will be N/A until you add it.
  const totalPages = Number(selectedBook?.totalPages || 0);
  const progressPercentage =
    totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0;
  const remainingPages = totalPages > 0 ? Math.max(0, totalPages - currentPage) : 0;

  const avgPagesPerReport = useMemo(() => {
    if (!reports.length) return 0;
    const sum = reports.reduce((acc, r) => acc + (Number(r.pagesTo) - Number(r.pagesFrom)), 0);
    return Math.max(0, Math.round(sum / reports.length));
  }, [reports]);

  const readingStreak = useMemo(() => {
    if (!reports.length) return 0;
    const dates = Array.from(new Set(reports.map((r) => toISODate(r.readingDate)))).sort().reverse();
    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const cur = new Date(dates[i]);
      const diff = Math.round((prev.getTime() - cur.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) streak++;
      else break;
    }
    return dates.length ? streak : 0;
  }, [reports]);

  const lastReportDate = useMemo(() => {
    if (!reports.length) return "";
    return toISODate(reports[0].readingDate);
  }, [reports]);

  const daysSinceLastReport = useMemo(() => {
    if (!lastReportDate) return Infinity;
    const diff = Math.round(
      (new Date(todayISO).getTime() - new Date(lastReportDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff;
  }, [lastReportDate, todayISO]);

  const isStreakBroken = reports.length > 0 && daysSinceLastReport >= 3;
  const isStreakRestored = Boolean(restoredForDate && restoredForDate === lastReportDate && isStreakBroken);
  const displayStreak = isStreakBroken ? (isStreakRestored ? readingStreak : 0) : readingStreak;
  const restoresLeft = Math.max(0, 5 - restoreCount);

  const { data: restoreResp } = useQuery({
    queryKey: ["daily-reports", "streak-restore"],
    enabled: Boolean(authUser?._id),
    queryFn: async () => {
      const res = await api.get("/daily-reports/streak-restore");
      return res.data;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!restoreResp) return;
    setRestoreCount(Number(restoreResp.count || 0));
    setRestoredForDate(restoreResp.restoredForDate || "");
  }, [restoreResp]);

  const handleRestoreStreak = async () => {
    if (!isStreakBroken) return;
    if (restoresLeft <= 0) {
      toast.error("No restores left this month. Start a new streak.");
      return;
    }
    try {
      const res = await api.post("/daily-reports/streak-restore", {
        restoredForDate: lastReportDate,
      });
      setRestoreCount(Number(res.data?.count || 0));
      setRestoredForDate(res.data?.restoredForDate || "");
      qc.invalidateQueries({ queryKey: ["daily-reports", "streak-restore"] });
      setIsRestoreOpen(false);
      toast.success("Your streak has been restored.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to restore streak");
    }
  };

  // ---- create report ----
  const createReport = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/daily-reports", payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-reports", selectedBookId] });
      qc.invalidateQueries({ queryKey: ["my-goals"] });
      // Refresh notifications immediately so the bell updates without reload
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Reading report submitted successfully!");
      setRestoredForDate("");
      qc.invalidateQueries({ queryKey: ["daily-reports", "streak-restore"] });
      setIsCreateOpen(false);
      setReadingDate("");
      setPagesFrom("");
      setPagesTo("");
      setTimeSpent("");
      setSummary("");
      setRating(0);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to submit report");
    },
  });

  const submitReport = () => {
    if (!selectedBookId) {
      toast.error("Select a book first");
      return;
    }

    if (!readingDate || !pagesFrom || !pagesTo || !timeSpent || !summary || rating === 0) {
      toast.error("Please fill in all fields");
      return;
    }

    if (readingDate !== minAllowedDate && readingDate !== maxAllowedDate) {
      toast.error(`Allowed dates: ${minAllowedDate} and ${maxAllowedDate}`);
      return;
    }

    const pf = Number(pagesFrom);
    const pt = Number(pagesTo);

    // NEW FEATURE: enforce start page in UI too
    if (pf !== nextPagesFrom) {
      toast.error(`Pages From must be ${nextPagesFrom} based on your previous report.`);
      return;
    }

    if (Number.isNaN(pf) || Number.isNaN(pt) || pt <= pf) {
      toast.error("Pages To must be greater than Pages From");
      return;
    }

    createReport.mutate({
      book: selectedBookId,
      readingDate,
      pagesFrom: pf,
      pagesTo: pt,
      timeSpent: Number(timeSpent),
      summary,
      rating,
    });
  };

  return (
    <div className="min-h-screen  py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-orange-600" />
            <div>
              <h1 className="text-3xl font-semibold dark:text-white text-gray-900">My Reading Report</h1>
              <p className="text-sm text-gray-600 dark:text-white mt-1">Track your daily reading and progress</p>
            </div>
          </div>

          {/* Book selector */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 max-w-md">
              <Select value={selectedBookId} onValueChange={setSelectedBookId} disabled={booksLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={booksLoading ? "Loading books..." : "Select a book"} />
                </SelectTrigger>
                <SelectContent>
                  {issuedBooks.map((book) => (
                    <SelectItem key={book._id} value={book._id}>
                      {book.title} {book.author ? `— ${book.author}` : ""}
                    </SelectItem>
                  ))}

                  {!booksLoading && issuedBooks.length === 0 && (
                    <div className="px-3 py-2 text-sm text-slate-500">
                      No issued/requested books found for your account.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Summary header + Create button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold dark:text-white text-gray-900">Summary</h2>
            <p className="text-sm text-gray-600 dark:text-white">Quick overview for the selected book.</p>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="w-4 h-4 mr-2" /> Create report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <Card className="h-full shadow-sm min-w-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-orange-600" />
                <p className="text-xs dark:text-white text-gray-600">Total Pages</p>
              </div>
              <p className="text-2xl font-semibold dark:text-white text-gray-900">{totalPages > 0 ? totalPages : "—"}</p>
            </CardContent>
          </Card>

          <Card className="h-full shadow-sm min-w-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-orange-600" />
                <p className="text-xs dark:text-white text-gray-600">Pages Read</p>
              </div>
              <p className="text-2xl font-semibold dark:text-white text-gray-900">{currentPage}</p>
              <p className="text-xs text-gray-500">{totalPages > 0 ? `${progressPercentage}%` : "N/A"}</p>
            </CardContent>
          </Card>

          <Card className="h-full shadow-sm min-w-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4  text-orange-600" />
                <p className="text-xs dark:text-white text-gray-600">Remaining</p>
              </div>
              <p className="text-2xl font-semibold dark:text-white text-gray-900">{totalPages > 0 ? remainingPages : "—"}</p>
            </CardContent>
          </Card>

          <Card
            className={
              isStreakBroken && !isStreakRestored
                ? "h-full shadow-sm min-w-0 border border-red-200 bg-red-50"
                : isStreakRestored
                ? "h-full shadow-sm min-w-0 border border-amber-200 bg-amber-50"
                : "h-full shadow-sm min-w-0"
            }
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Flame className={`w-4 h-4 ${isStreakBroken && !isStreakRestored ? "text-red-600" : "text-orange-600"}`} />
                <p className={`text-xs ${isStreakBroken && !isStreakRestored ? "text-red-700" : "text-gray-600"}`}>
                  {isStreakBroken && !isStreakRestored ? "Streak Broken" : isStreakRestored ? "Streak Restored" : "Streak"}
                </p>
              </div>
              <p className={`text-2xl font-semibold ${isStreakBroken && !isStreakRestored ? "text-red-700" : "dark:text-orange-600"}`}>
                {displayStreak}
              </p>
              <div className="flex items-center gap-2">
                <p className={`text-xs ${isStreakBroken && !isStreakRestored ? "text-red-600" : "text-gray-500"}`}>days</p>
                {isStreakBroken && !isStreakRestored && (
                  <button
                    type="button"
                    onClick={() => setIsRestoreOpen(true)}
                    className="text-xs text-red-700 underline underline-offset-2"
                  >
                    Restore streak
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="hidden h-full shadow-sm min-w-0 xl:block">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <p className="text-xs dark:text-white text-gray-600">Avg/Report</p>
              </div>
              <p className="text-2xl font-semibold text-gary-600">{avgPagesPerReport}</p>
              <p className="text-xs dark:text-white text-gray-500">pages</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        <Card className="shadow-sm w-full ">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Reading Progress</h3>
                <span className="text-sm font-medium text-blue-600">
                  {totalPages > 0 ? `${progressPercentage}%` : "N/A"}
                </span>
              </div>
              <Progress value={totalPages > 0 ? progressPercentage : 0} className="h-3" />
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{totalPages > 0 ? `Page ${currentPage} of ${totalPages}` : "Add totalPages to Book model to calculate progress"}</span>
                <span>{totalPages > 0 ? `${remainingPages} pages remaining` : ""}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reading Story last 3 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Reading Story (Last 3 reports)</CardTitle>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="text-sm text-gray-500">Loading reports...</div>
            ) : lastThree.length === 0 ? (
              <div className="text-sm text-gray-500">No reports yet. Create your first report.</div>
            ) : (
              <div className="space-y-3">
                {lastThree.map((r) => (
                  <div key={r._id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center gap-1 font-medium text-gray-900">
                            <Calendar className="w-4 h-4" />
                            {new Date(r.readingDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            Pages {r.pagesFrom} - {r.pagesTo} ({Number(r.pagesTo) - Number(r.pagesFrom)} pages)
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {r.timeSpent} mins
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>

                        <p className="text-sm text-gray-700">{r.summary}</p>
                      </div>
{/* 
                      <Badge className={`${getReportStatusColor(r.status)} flex items-center gap-1`}>
                        {r.status === "Approved" && <CheckCircle className="w-3 h-3" />}
                        {r.status === "Pending" && <Clock className="w-3 h-3" />}
                        {r.status === "Needs Improvement" && <AlertTriangle className="w-3 h-3" />}
                        {r.status || "Pending"}
                      </Badge> */}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" /> Create Reading Report
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Reading Date (only today/yesterday)
                </Label>
                <Input
                  type="date"
                  value={readingDate}
                  min={minAllowedDate}
                  max={maxAllowedDate}
                  onChange={(e) => setReadingDate(e.target.value)}
                />
                <p className="text-xs text-gray-500">Allowed: {minAllowedDate} and {maxAllowedDate}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pages From</Label>
                  {/* NEW FEATURE: readOnly so it always starts correctly */}
                  <Input type="number" value={pagesFrom} readOnly />
                  <p className="text-xs text-gray-500">
                    Start page is auto-set based on your previous report.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Pages To</Label>
                  <Input type="number" value={pagesTo} onChange={(e) => setPagesTo(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time Spent (minutes)
                </Label>
                <Input type="number" value={timeSpent} onChange={(e) => setTimeSpent(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Summary
                </Label>
                <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Rating
                </Label>
                <StarRating value={rating} onChange={setRating} />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={submitReport}
                disabled={createReport.isPending || !selectedBookId}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {createReport.isPending ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit report"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" /> Restore your streak?
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2 text-sm text-gray-600">
              <p>Your streak broke after 3 consecutive missed days.</p>
              <p>
                Restores left this month: <span className="font-semibold">{restoresLeft}</span>
              </p>
              {restoresLeft <= 0 && <p className="text-red-600">No restores left. Start a new streak.</p>}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsRestoreOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRestoreStreak}
                disabled={restoresLeft <= 0 || !isStreakBroken}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Restore streak
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}