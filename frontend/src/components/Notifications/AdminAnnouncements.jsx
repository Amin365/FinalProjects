import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Megaphone,
  Send,
  Users,
  Eye,
  History,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import api from "@/app/api/apislice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSelector } from "react-redux";

const TARGET_AUDIENCES = [
  { value: "all", label: "All Users", description: "All active users" },
  { value: "students", label: "All Students", description: "All student users" },
  { value: "program_teachers", label: "Program Teachers", description: "All volunteers/teachers" },
  { value: "my_students", label: "My Students", description: "Students enrolled in my programs" },
  { value: "inactive", label: "Inactive Users", description: "Users linked to inactive members" },
  { value: "overdue", label: "Users with Overdue", description: "Users with overdue books" },
];

const getRoleName = (authUser) => {
  const roleSource = authUser?.role;
  if (!roleSource) return "";
  if (typeof roleSource === "object") {
    return String(roleSource.role || roleSource.name || roleSource.title || "").toLowerCase().trim();
  }
  return String(roleSource).toLowerCase().trim();
};

const isAdminRoleName = (roleName = "") => /super\s*admin/i.test(roleName) || /^admin$/i.test(roleName);

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString();
}

export default function AdminAnnouncements() {
  const qc = useQueryClient();
  const authUser = useSelector((state) => state.auth?.user);
  const roleName = useMemo(() => getRoleName(authUser), [authUser]);

  const allowedAudienceValues = useMemo(() => {
    if (isAdminRoleName(roleName)) {
      return ["all", "students", "program_teachers", "inactive", "overdue"];
    }
    if (roleName === "library staff") {
      return ["students", "program_teachers"];
    }
    if (roleName === "volunteer" || roleName === "teacher") {
      return ["my_students"];
    }
    return [];
  }, [roleName]);

  const availableAudiences = useMemo(() => {
    const allowed = new Set(allowedAudienceValues);
    return TARGET_AUDIENCES.filter((a) => allowed.has(a.value));
  }, [allowedAudienceValues]);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");
  const [sendEmail, setSendEmail] = useState(false);
  const [sendPush, setSendPush] = useState(true);
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!allowedAudienceValues.length) return;
    if (!allowedAudienceValues.includes(targetAudience)) {
      setTargetAudience(allowedAudienceValues[0]);
    }
  }, [allowedAudienceValues, targetAudience]);

  // Audience preview
  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ["announcement-preview", targetAudience],
    queryFn: async () => {
      const res = await api.get("/announcements/preview", {
        params: { targetAudience },
      });
      return res.data?.data;
    },
    enabled: !!targetAudience && allowedAudienceValues.includes(targetAudience),
  });

  // Announcement history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["announcement-history"],
    queryFn: async () => {
      const res = await api.get("/announcements/history");
      return res.data;
    },
    enabled: showHistory,
  });

  // Send announcement mutation
  const sendMutation = useMutation({
    mutationFn: (data) => api.post("/announcements", data),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Announcement sent!");
      setTitle("");
      setMessage("");
      setCtaLabel("");
      setCtaUrl("");
      qc.invalidateQueries({ queryKey: ["announcement-history"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to send announcement");
    },
  });

  const handleSend = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!message.trim()) {
      toast.error("Message is required");
      return;
    }

    sendMutation.mutate({
      title: title.trim(),
      message: message.trim(),
      targetAudience,
      sendEmail,
      sendPush,
      ctaLabel: ctaLabel.trim() || undefined,
      ctaUrl: ctaUrl.trim() || undefined,
    });
  };

  const history = historyData?.data || [];

  return (
    <div className="space-y-6 px-4 lg:px-6 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-orange-500" />
          Bulk Announcements
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send notifications to groups of users
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Compose Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compose Announcement</CardTitle>
              <CardDescription>
                Create a new announcement to send to your selected audience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-sm font-medium mb-1 block">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement title..."
                  className="w-full rounded-lg border border-input bg-transparent dark:bg-input/30 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">{title.length}/100 characters</p>
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-medium mb-1 block">Message *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your announcement message..."
                  rows={5}
                  className="w-full rounded-lg border border-input bg-transparent dark:bg-input/30 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1">{message.length}/1000 characters</p>
              </div>

              {/* Target Audience */}
              <div>
                <label className="text-sm font-medium mb-1 block">Target Audience</label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAudiences.map((aud) => (
                      <SelectItem key={aud.value} value={aud.value}>
                        <div>
                          <span className="font-medium">{aud.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">{aud.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* CTA (Optional) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">CTA Button Label</label>
                  <input
                    type="text"
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    placeholder="e.g., View Details"
                    className="w-full rounded-lg border border-input bg-transparent dark:bg-input/30 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">CTA URL</label>
                  <input
                    type="url"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-input bg-transparent dark:bg-input/30 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Delivery Options */}
              <div className="flex items-center gap-6 py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendPush}
                    onChange={(e) => setSendPush(e.target.checked)}
                    className="w-4 h-4 rounded border-input bg-transparent dark:bg-input/30 accent-orange-500"
                  />
                  <span className="text-sm">Send Push Notification</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="w-4 h-4 rounded border-input bg-transparent dark:bg-input/30 accent-orange-500"
                  />
                  <span className="text-sm">Send Email</span>
                </label>
              </div>

              {/* Warning for email */}
              {sendEmail && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium">Email delivery notice</p>
                    <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">
                      Sending emails to many users may take time and could be rate limited by the email provider.
                    </p>
                  </div>
                </div>
              )}

              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={sendMutation.isPending || !title.trim() || !message.trim()}
                className="w-full"
              >
                {sendMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to {previewData?.count || 0} users
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Audience Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {previewLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">{previewData?.count || 0}</p>
                      <p className="text-xs text-muted-foreground">recipients</p>
                    </div>
                  </div>

                  {previewData?.preview?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Sample recipients:</p>
                      <div className="space-y-1.5">
                        {previewData.preview.map((user, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                              {user.name?.charAt(0) || "?"}
                            </span>
                            <span className="flex-1 truncate">{user.name || "Unknown"}</span>
                          </div>
                        ))}
                        {previewData.count > 5 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            +{previewData.count - 5} more...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Notification Preview */}
          {(title || message) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-3 border border-border">
                  <div className="flex items-start gap-2">
                    <Megaphone className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{title || "Announcement Title"}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                        {message || "Your announcement message will appear here..."}
                      </p>
                      {ctaLabel && ctaUrl && (
                        <p className="text-xs text-orange-500 mt-2">{ctaLabel} →</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* History Section */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setShowHistory(!showHistory)}
        >
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Announcement History
            </span>
            {showHistory ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </CardTitle>
        </CardHeader>
        {showHistory && (
          <CardContent>
            {historyLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No announcements sent yet
              </p>
            ) : (
              <div className="divide-y divide-border">
                {history.map((item, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {item.message}
                        </p>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        {item.targetAudience}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{formatDate(item.createdAt)}</span>
                      <span>•</span>
                      <span>{item.recipientCount} recipients</span>
                      <span>•</span>
                      <span>{item.readCount} read</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
