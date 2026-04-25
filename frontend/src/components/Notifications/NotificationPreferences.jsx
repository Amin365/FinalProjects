import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Bell, Mail, Moon, RotateCcw, Save, Loader2 } from "lucide-react";
import api from "@/app/api/apislice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-orange-500" : "bg-zinc-700"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function PreferenceItem({ label, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function PreferenceSkeleton() {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800/50">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-6 w-11 rounded-full" />
    </div>
  );
}

export default function NotificationPreferences() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const res = await api.get("/notification-preferences");
      return res.data?.data || res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updates) => api.patch("/notification-preferences", updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Preferences saved");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to save preferences"),
  });

  const resetMutation = useMutation({
    mutationFn: () => api.post("/notification-preferences/reset"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Preferences reset to defaults");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to reset preferences"),
  });

  const handleToggle = (key, value) => {
    updateMutation.mutate({ [key]: value });
  };

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>Failed to load preferences</p>
        <Button variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ["notification-preferences"] })} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const pushPreferences = [
    {
      key: "pushOnOverdue",
      label: "Overdue Books",
      description: "Get notified when your borrowed books become overdue",
    },
    {
      key: "pushOnDueTomorrow",
      label: "Due Tomorrow",
      description: "Reminder when books are due tomorrow",
    },
    {
      key: "pushOnStreakReminder",
      label: "Reading Streak Reminders",
      description: "Daily reminders to maintain your reading streak",
    },
    {
      key: "pushOnBlogAnnouncement",
      label: "Blog Posts",
      description: "Notifications for new blog posts and articles",
    },
    {
      key: "pushOnJoinRequestUpdate",
      label: "Join Request Updates",
      description: "Updates on membership request status",
    },
    {
      key: "pushOnChallengeReminder",
      label: "Challenge Reminders",
      description: "Progress updates and reminders for active challenges",
    },
    {
      key: "pushOnAchievementUnlock",
      label: "Achievement Unlocks",
      description: "Celebrate when you unlock new achievements",
    },
    {
      key: "pushOnGoalProgress",
      label: "Goal Progress",
      description: "Updates on your reading goal progress",
    },
    {
      key: "pushOnSystemAnnouncement",
      label: "System Announcements",
      description: "Important announcements from the club",
    },
  ];

  const emailPreferences = [
    {
      key: "emailOnOverdue",
      label: "Overdue Reminders",
      description: "Email reminders for overdue books",
    },
    {
      key: "emailOnDueTomorrow",
      label: "Due Tomorrow",
      description: "Email reminder when books are due tomorrow",
    },
    {
      key: "emailOnWeeklyDigest",
      label: "Weekly Digest",
      description: "Weekly summary of your reading activity",
    },
    {
      key: "emailOnJoinRequestUpdate",
      label: "Join Request Updates",
      description: "Email updates on membership requests",
    },
    {
      key: "emailOnGoalProgress",
      label: "Goal Progress",
      description: "Email congratulations when you complete a reading goal",
    },
    {
      key: "emailOnAnnouncement",
      label: "Announcements",
      description: "Receive important announcements via email",
    },
  ];

  return (
    <div className="space-y-6 px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-orange-500" />
            Notification Preferences
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control how and when you receive notifications
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => resetMutation.mutate()}
          disabled={resetMutation.isPending || isLoading}
        >
          {resetMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4 mr-2" />
          )}
          Reset to Defaults
        </Button>
      </div>

      {/* Push Notifications */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-orange-500" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Choose which push notifications you want to receive on your device
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <PreferenceSkeleton key={i} />)
          ) : (
            pushPreferences.map((pref) => (
              <PreferenceItem
                key={pref.key}
                label={pref.label}
                description={pref.description}
                checked={data?.[pref.key] ?? true}
                onChange={(value) => handleToggle(pref.key, value)}
                disabled={updateMutation.isPending}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-blue-500" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose which email notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <PreferenceSkeleton key={i} />)
          ) : (
            emailPreferences.map((pref) => (
              <PreferenceItem
                key={pref.key}
                label={pref.label}
                description={pref.description}
                checked={data?.[pref.key] ?? true}
                onChange={(value) => handleToggle(pref.key, value)}
                disabled={updateMutation.isPending}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Moon className="h-5 w-5 text-purple-500" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Pause push notifications during specific hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PreferenceSkeleton />
          ) : (
            <>
              <PreferenceItem
                label="Enable Quiet Hours"
                description="No push notifications during quiet hours"
                checked={data?.quietHoursEnabled ?? false}
                onChange={(value) => handleToggle("quietHoursEnabled", value)}
                disabled={updateMutation.isPending}
              />
              {data?.quietHoursEnabled && (
                <div className="flex items-center gap-4 py-3">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Start Time</label>
                    <input
                      type="time"
                      value={data?.quietHoursStart || "22:00"}
                      onChange={(e) => handleToggle("quietHoursStart", e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm"
                      disabled={updateMutation.isPending}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">End Time</label>
                    <input
                      type="time"
                      value={data?.quietHoursEnd || "08:00"}
                      onChange={(e) => handleToggle("quietHoursEnd", e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm"
                      disabled={updateMutation.isPending}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Status indicator */}
      {updateMutation.isPending && (
        <div className="fixed bottom-4 right-4 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
          <span className="text-sm">Saving...</span>
        </div>
      )}
    </div>
  );
}
