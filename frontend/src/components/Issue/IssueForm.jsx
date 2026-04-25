import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BookOpen, CalendarDays, User, Loader2 } from "lucide-react";

const fetchMember = async (memberId) => {
  const resp = await api.get(`/members/${memberId}`);
  return resp.data?.data ?? resp.data;
};

const fetchBooks = async () => {
  const resp = await api.get("/books", { params: { page: 1, limit: 500 } });
  // if your books endpoint is paginated like others:
  return resp.data?.data ?? resp.data ?? [];
};

const toISODate = (d) => new Date(d).toISOString().slice(0, 10);
const addDays = (dateStr, days) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

const IssueCreateForm = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params] = useSearchParams();

  const memberId = params.get("member");

  const { data: member, isLoading: memberLoading, error: memberError } = useQuery({
    queryKey: ["member", memberId],
    enabled: Boolean(memberId),
    queryFn: () => fetchMember(memberId),
    staleTime: 30_000,
  });

  const { data: booksData, isLoading: booksLoading } = useQuery({
    queryKey: ["books", "available"],
    queryFn: fetchBooks,
    staleTime: 30_000,
  });

  const availableBooks = useMemo(() => {
    const arr = Array.isArray(booksData) ? booksData : [];
    return arr.filter((b) => (b.status || "").toLowerCase() === "available");
  }, [booksData]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      member: memberId || "",
      book: "",
      issueDate: "",
      returnDate: "",
    },
  });

  const selectedBook = watch("book");
  const issueDateValue = watch("issueDate");
  const maxReturnDate = addDays(issueDateValue, 7);

  const createIssue = useMutation({
    mutationFn: async (payload) => {
      const resp = await api.post("/issue", payload);
      return resp.data?.data ?? resp.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["books"] });
      // Ensure header notifications refresh immediately
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Book issued successfully!");
      navigate("/dashboard/issues/request"); // table page
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || "Failed to issue book";
      toast.error(msg);
    },
  });

  const onSubmit = async (data) => {
    if (!memberId) {
      toast.error("Member not selected");
      return;
    }

    if (data.issueDate && data.returnDate) {
      const issueDt = new Date(data.issueDate);
      const returnDt = new Date(data.returnDate);
      const diffDays = Math.round((returnDt.getTime() - issueDt.getTime()) / (1000 * 60 * 60 * 24));

      if (Number.isNaN(diffDays) || diffDays < 0) {
        toast.error("Return date must be after issue date");
        return;
      }

      if (diffDays > 7) {
        toast.error("Return date must be within 7 days of the issue date");
        return;
      }
    }

    const payload = {
      member: memberId,
      book: data.book,
      issueDate: data.issueDate,
      returnDate: data.returnDate,
    };

    await createIssue.mutateAsync(payload);
  };

  if (!memberId) {
    return (
      <div className="p-6 max-w-7xl mx-auto"> 
        <p className="text-slate-600">No member selected. Go back and enter MemberId.</p>
        <Button className="mt-4 dark:bg-orange-600" onClick={() => navigate("/dashboard/issues/request")}>
          Go to MemberId page
        </Button>
      </div>
    );
  }

  if (memberError) {
    return (
      <div className="p-6">
        <p className="text-red-600">
          Member not found. Before requesting book you must be member the Club.
        </p>
        <Button className="mt-4 dark:bg-orange-600" onClick={() => navigate("/dashboard/issues/request")}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] p-4  flex justify-center">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Issue Book</h1>
            <p className="text-sm mt-1 text-slate-500 dark:text-gray-300">
              Create a new issue request for an available book.
            </p>
          </div>

          <Button variant="outline" onClick={() => navigate("/dashboard/issues/request")}>
            <ArrowLeft size={16} /> <span className="ml-2">Back</span>
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-white">Issue Form</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Member info */}
            <div className="rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 mb-12">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <User size={16} /> Member Information
              </div>

              {memberLoading ? (
                <div className="mt-3 text-sm text-slate-500">Loading member...</div>
              ) : (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 ">
                  <div>
                    <div className="text-xs text-slate-500">MemberId</div>
                    <div className="text-sm font-medium text-slate-800 dark:text-white">{member?.code || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Full Name</div>
                    <div className="text-sm font-medium text-slate-800 dark:text-white">
                      {member?.full_name ||
                        [member?.first_name, member?.middle_name, member?.last_name].filter(Boolean).join(" ") ||
                        "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Email</div>
                    <div className="text-sm font-medium text-slate-800 dark:text-white">{member?.email || "—"}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Book */}
              <div className="space-y-2 mb-8">
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-200 flex items-center gap-2">
                  <BookOpen size={16} /> Select Book <span className="text-red-500">*</span>
                </label>

                <Select
                  value={selectedBook}
                  onValueChange={(v) => setValue("book", v, { shouldValidate: true })}
                  disabled={booksLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={booksLoading ? "Loading books..." : "Choose an available book"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBooks.map((b) => (
                      <SelectItem key={b._id} value={b._id}>
                        {b.title} — {b.author || "Unknown"} ({b.isbn})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <input type="hidden" {...register("book", { required: "Book is required" })} />
                {errors.book && <p className="text-xs text-red-500">{errors.book.message}</p>}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-200 flex items-center gap-2">
                    <CalendarDays size={16} /> Issue Date <span className="text-red-500">*</span>
                  </label>
                  <Input type="date" {...register("issueDate", { required: "Issue date is required" })} />
                  {errors.issueDate && <p className="text-xs text-red-500">{errors.issueDate.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-200 flex items-center gap-2">
                    <CalendarDays size={16} /> Return Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    min={issueDateValue || undefined}
                    max={maxReturnDate || undefined}
                    {...register("returnDate", {
                      required: "Return date is required",
                      validate: (value) => {
                        if (!issueDateValue || !value) return true;
                        const issueDt = new Date(issueDateValue);
                        const returnDt = new Date(value);
                        const diffDays = Math.round(
                          (returnDt.getTime() - issueDt.getTime()) / (1000 * 60 * 60 * 24)
                        );
                        if (Number.isNaN(diffDays) || diffDays < 0) return "Return date must be after issue date";
                        if (diffDays > 7) return "Return date must be within 7 days of issue date";
                        return true;
                      },
                    })}
                  />
                  {errors.returnDate && <p className="text-xs text-red-500">{errors.returnDate.message}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 mt-5">
                <Button type="button" variant="outline" onClick={() => navigate("/dashboard/issues")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createIssue.isPending || memberLoading}>
                  {createIssue.isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> <span className="ml-2">Issuing...</span>
                    </>
                  ) : (
                    "Issue Book"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IssueCreateForm;