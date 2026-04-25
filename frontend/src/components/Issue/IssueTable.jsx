import React, { useMemo } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Book, Calendar, CheckCircle2, Plus } from "lucide-react";

const fetchIssues = async ({ queryKey }) => {
  const [, params] = queryKey;
  const { page = 1, limit = 10, q, status } = params || {};
  const res = await api.get("/issue", { params: { page, limit, q, status } });
  // return structured payload expected by UI
  return res.data ?? { data: [], total: 0, page: 1, totalPages: 0, limit };
};


const formatDate = (dateStr) => (dateStr ? new Date(dateStr).toLocaleDateString() : "—");

const statusClass = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "issued") return "bg-blue-100 text-blue-700 hover:bg-blue-100";
  if (s === "returned") return "bg-green-100 text-green-700 hover:bg-green-100";
  if (s === "overdue") return "bg-red-100 text-red-700 hover:bg-red-100";
  return "bg-slate-100 text-slate-700 hover:bg-slate-100";
};

const IssuesTable = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ["issues", { page, limit }],
    queryFn: fetchIssues,
    staleTime: 20_000,
  });

  const isDueTomorrow = (returnDate) => {
  if (!returnDate) return false;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return (
    new Date(returnDate).toDateString() === tomorrow.toDateString()
  );
};

const sendReminderMutation = useMutation({
  mutationFn: (id) => api.post(`/issue/${id}/send-reminder`),
  onSuccess: () => toast.success("Reminder email sent"),
  onError: (err) => toast.error(err?.response?.data?.message || "Failed"),
});



  const issues = data?.data ?? [];


  const totalItems = data?.total ?? 0;
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil((totalItems || 0) / limit));

  const markReturned = useMutation({
    mutationFn: async (id) => {
      const res = await api.patch(`/issue/${id}/return`);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["books"] });
      // Refresh notifications for return events
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Marked as returned");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to mark returned");
    },
  });

  const rows = useMemo(() => issues, [issues]);

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500 p-4 ">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Issued Books</h1>
          <p className="text-sm mt-1 text-slate-500 dark:text-gray-300">Track issued/returned books.</p>
        </div>

        {/* <div className="flex gap-3">
          <Button onClick={() => navigate("/dashboard/issues/request")}>
            <Plus size={16} /> <span className="ml-2">Issue Book</span>
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> <span className="ml-2">Back</span>
          </Button>
        </div> */}
      </div>

      <Card className="flex-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700">
              <tr>
                <th className="p-4 font-semibold text-slate-500 dark:text-white">Book</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-white">Member</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-white">Issue Date</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-white">Return Date</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-white">Status</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-white text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
              {rows.map((it) => {
                const memberName =
                  it.member?.full_name ||
                  [it.member?.first_name, it.member?.middle_name, it.member?.last_name]
                    .filter(Boolean)
                    .join(" ");

                return (
                  <tr key={it._id} className="group hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Book className="w-4 h-4 text-slate-500" />
                        <div>
                          <div className="font-medium text-slate-800 dark:text-white">{it.book?.title || "—"}</div>
                          <div className="text-xs text-slate-500 dark:text-gray-300">{it.book?.isbn || ""}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-slate-700 dark:text-white">
                      <div className="font-medium">{memberName || "—"}</div>
                      <div className="text-xs text-slate-500">{it.member?.code || ""}</div>
                    </td>

                    <td className="p-4 text-slate-700 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        {formatDate(it.issueDate)}
                      </div>
                    </td>

                    <td className="p-4 text-slate-700 dark:text-white">{formatDate(it.returnDate)}</td>

                    <td className="p-4">
                      <Badge className={cn(statusClass(it.status))}>{it.status || "Issued"}</Badge>
                    </td>

                    <td className="p-4 text-right">
  <div className="flex justify-end gap-2">
    {it.status !== "Returned" && (
      <>
        <Button
          size="sm"
          variant="outline"
          onClick={() => markReturned.mutate(it._id)}
          disabled={markReturned.isPending}
          className="text-emerald-600 hover:text-emerald-700"
        >
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Mark Returned
        </Button>

        {/* Quick Action: Send Reminder */}
        {/* <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            try {
              await api.post(`/issue/${it._id}/send-reminder`);
              toast.success("Reminder email sent");
            } catch (err) {
              toast.error(err?.response?.data?.message || "Failed to send reminder");
            }
          }}
          className="text-red-600 hover:text-red-700"
        >
          <Book className="w-4 h-4 mr-1" />
          Send Reminder
        </Button> */}

        {isDueTomorrow(it.returnDate) && it.status !== "Returned" && (
  <Button
    size="sm"
    variant="outline"
      onClick={() => sendReminderMutation.mutate(it._id)}
  
    className="text-red-600 hover:text-red-700"
  >
    <Book className="w-4 h-4 mr-1" />
    Send Reminder
  </Button>
)}

      </>
    )}
  </div>
</td>


                  
                  </tr>
                );
              })}

              {isLoading && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 dark:text-gray-400">
                    Loading issues...
                  </td>
                </tr>
              )}

              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 dark:text-gray-400">
                    No issued books yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t bg-card">
          <div className="text-sm text-muted-foreground">Showing {issues.length} of {totalItems}</div>
          <div className="flex items-center gap-2">
            <Button size="sm" 
            className="dark:bg-orange-600"
            onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1 || isLoading}>
              Prev
            </Button>
            <span className="px-3 py-2 rounded-lg text-sm font-semibold bg-muted text-foreground">{page} / {totalPages}</span>
            <Button size="sm" 
            className="dark:bg-orange-600"
            onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages || isLoading}>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default IssuesTable;