
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, User, ArrowUpRight } from "lucide-react";

const timeAgo = (date) => {
  const t = date ? new Date(date).getTime() : 0;
  if (!t) return "—";
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
};

export default function RecentActions() {
  const booksQ = useQuery({
    queryKey: ["books", "recent"],
    queryFn: () => api.get("/books", { params: { page: 1, limit: 3 } }),
    select: (r) => r.data?.data ?? [],
    refetchInterval: 10_000, // ✅ auto refresh (polling)
    staleTime: 5_000,
  });

  const issuesQ = useQuery({
    queryKey: ["issues", "recent"],
    queryFn: () => api.get("/issue", { params: { page: 1, limit: 3 } }),
    select: (r) => r.data?.data ?? [],
    refetchInterval: 10_000, // ✅ auto refresh
    staleTime: 5_000,
  });

  const recentBooks = useMemo(() => {
    const arr = Array.isArray(booksQ.data) ? booksQ.data : [];
    return arr
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [booksQ.data]);

  const recentIssues = useMemo(() => {
    const arr = Array.isArray(issuesQ.data) ? issuesQ.data : [];
    return arr
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [issuesQ.data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Recent Books */}
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Recent Books Added
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentBooks.map((b) => (
            <div key={b._id} className="flex items-start justify-between gap-4 border rounded-md p-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{b.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {b.author ? b.author : "Unknown author"} • {b.isbn}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" /> {timeAgo(b.createdAt)}
                </div>
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
          ))}

          {!booksQ.isLoading && recentBooks.length === 0 && (
            <div className="text-sm text-muted-foreground">No books found.</div>
          )}
        </CardContent>
      </Card>

      {/* Recent Issues */}
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Recent Issued Books
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentIssues.map((it) => {
            const bookTitle = it.book?.title ?? "(book not populated)";
            const memberName =
              it.member?.full_name ||
              [it.member?.first_name, it.member?.middle_name, it.member?.last_name].filter(Boolean).join(" ") ||
              "(member not populated)";

            return (
              <div key={it._id} className="flex items-start justify-between gap-4 border rounded-md p-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{bookTitle}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    Issued to: {memberName}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" /> {timeAgo(it.createdAt)}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            );
          })}

          {!issuesQ.isLoading && recentIssues.length === 0 && (
            <div className="text-sm text-muted-foreground">No issues found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}