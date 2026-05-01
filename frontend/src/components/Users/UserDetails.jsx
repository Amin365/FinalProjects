
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Save, KeyRound, Mail, User2, Shield,
  CalendarClock, AtSign, Loader2, BadgeCheck,
  UserCircle2, Lock, Eye, EyeOff, CheckCircle2,
  Sparkles, Edit3,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/app/api/apislice";
import Loader from "@/components/Loader";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/* 
   CONSTANTS
 */
const emptyForm = {
  first_name: "", middle_name: "", last_name: "",
  username: "", email: "", status: "Active", role_id: "", Bio: "",
};

const STATUS_META = {
  Active:   { dot: "bg-emerald-500", pill: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40" },
  Inactive: { dot: "bg-red-500",     pill: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40" },
  Pending:  { dot: "bg-amber-500",   pill: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40" },
  pending:  { dot: "bg-amber-500",   pill: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40" },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A";

/* 
   SMALL HELPERS
 */
const inputCls =
  "w-full px-4 py-3 rounded-xl text-[13px] bg-slate-50 dark:bg-gray-800 " +
  "border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-gray-100 " +
  "placeholder:text-slate-300 dark:placeholder:text-gray-600 " +
  "focus:outline-none focus:ring-2 focus:ring-orange-300 dark:focus:ring-orange-800/60 focus:border-orange-400 transition-all";

const FL = ({ children, req }) => (
  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
    {children}{req && <span className="text-orange-500 ml-0.5">*</span>}
  </label>
);

const FieldBox = ({ label, req, children }) => (
  <div className="flex flex-col">
    <FL req={req}>{label}</FL>
    {children}
  </div>
);

const selectCls = `${inputCls} appearance-none cursor-pointer`;

const InfoRow = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-gray-800 last:border-0">
    <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0 mt-0.5">
      <Icon size={14} className="text-orange-500" />
    </div>
    <div className="min-w-0">
      <p className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
      <p className={`text-[13.5px] font-semibold mt-0.5 truncate ${accent || "text-slate-800 dark:text-slate-100"}`}>{value}</p>
    </div>
  </div>
);

/* 
   MAIN COMPONENT
 */
export default function UserDetailsAdmin() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [form,          setForm]          = useState(emptyForm);
  const [activeTab,     setActiveTab]     = useState("profile");
  const [showNewPass,   setShowNewPass]   = useState(false);
  const [showConfPass,  setShowConfPass]  = useState(false);
  const [passwordData,  setPasswordData]  = useState({
    newPassword: "", confirmPassword: "", mustChangePassword: true,
  });

  /*  queries  */
  const { data: userData, isLoading } = useQuery({
    queryKey: ["user-details", id],
    queryFn: async () => { const res = await api.get(`/users/${id}`); return res.data?.data || res.data; },
    enabled: !!id, staleTime: 30_000,
  });

  const { data: rolesData } = useQuery({
    queryKey: ["roles-for-user-edit"],
    queryFn: async () => { const res = await api.get("/roles"); return res.data?.data || []; },
  });

  const roles         = useMemo(() => Array.isArray(rolesData) ? rolesData : [], [rolesData]);
  const targetUserId  = userData?._id || userData?.id || id;
  const fullName      = useMemo(() => [form.first_name, form.middle_name, form.last_name].filter(Boolean).join(" ").trim(), [form]);
  const initials      = useMemo(() => [form.first_name?.[0], form.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "U", [form]);
  const selectedRole  = useMemo(() => roles.find(r => String(r._id) === String(form.role_id)), [roles, form.role_id]);
  const statusMeta    = STATUS_META[form.status] || STATUS_META.Active;

  useEffect(() => {
    if (!userData) return;
    setForm({
      first_name:  userData.first_name  || "",
      middle_name: userData.middle_name || "",
      last_name:   userData.last_name   || "",
      username:    userData.username    || "",
      email:       userData.email       || "",
      status:      userData.status      || "Active",
      role_id:     userData.role?._id   ? String(userData.role._id) : "",
      Bio:         userData.Bio         || "",
    });
  }, [userData]);

  /*  mutations  */
  const updateMutation = useMutation({
    mutationFn: payload => api.patch(`/users/${targetUserId}`, payload).then(r => r.data?.data || r.data),
    onSuccess: () => {
      toast.success("User details updated successfully");
      queryClient.invalidateQueries({ queryKey: ["user-details", id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: err => toast.error(err?.response?.data?.message || "Failed to update user"),
  });

  const passwordMutation = useMutation({
    mutationFn: payload => api.put(`/users/${targetUserId}/password`, payload).then(r => r.data),
    onSuccess: () => {
      toast.success("Password updated successfully");
      setPasswordData({ newPassword: "", confirmPassword: "", mustChangePassword: true });
    },
    onError: err => toast.error(err?.response?.data?.message || "Failed to update password"),
  });

  const handleSave = () => {
    const payload = { ...form, role_id: form.role_id ? String(form.role_id) : null };
    updateMutation.mutate(payload);
  };

  const handlePasswordUpdate = () => {
    if (!passwordData.newPassword) { toast.error("Please enter a new password"); return; }
    if (passwordData.newPassword !== passwordData.confirmPassword) { toast.error("Passwords do not match"); return; }
    passwordMutation.mutate(passwordData);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 pb-20">

      {/*  Top bar ─ */}
      <div className="bg-white dark:bg-gray-900 border-b border-slate-100 dark:border-gray-800 px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard/users")}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-gray-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-orange-500 transition-all"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-[17px] font-extrabold text-slate-900 dark:text-white tracking-tight">User Details</h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Manage account, role and security settings</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-extrabold shadow-md shadow-orange-200 dark:shadow-orange-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          >
            {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-8">

        {/*  Profile hero card  */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-100 dark:border-gray-800 shadow-sm overflow-hidden mb-8">
          {/* Cover */}
          <div className="relative h-32 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500">
            {/* dot grid */}
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
          </div>

          <div className="px-6 md:px-8 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-10 relative">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 border-4 border-white dark:border-gray-900 shadow-xl flex items-center justify-center text-white text-[26px] font-extrabold shrink-0">
                {initials}
              </div>

              <div className="flex-1 mt-2 md:mt-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div>
                    <h2 className="text-[22px] font-extrabold text-slate-900 dark:text-white leading-tight">
                      {fullName || "Unnamed User"}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5"><AtSign size={12} />{form.username || "—"}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <span className="flex items-center gap-1.5"><Mail size={12} />{form.email || "—"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:ml-2 flex-wrap">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${statusMeta.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                      {form.status}
                    </span>
                    {selectedRole && (
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full border bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-gray-700 flex items-center gap-1.5">
                        <Shield size={11} className="text-orange-400" />
                        {selectedRole.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Joined date chip */}
              <div className="shrink-0 hidden md:flex items-center gap-1.5 text-[11.5px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 px-3 py-1.5 rounded-xl mt-8">
                <CalendarClock size={12} /> Joined {fmtDate(userData?.createdAt)}
              </div>
            </div>
          </div>
        </div>

        {/*  Tabs  */}
        <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-gray-800">
          {[
            { key: "profile",  label: "Profile",  icon: User2   },
            { key: "security", label: "Security", icon: Shield  },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-3 text-[13px] font-bold border-b-2 transition-all -mb-px
                ${activeTab === key
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* 
            PROFILE TAB
         */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main form */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                  <Edit3 size={14} className="text-orange-500" />
                </div>
                <div>
                  <h3 className="text-[14px] font-extrabold text-slate-900 dark:text-white">Profile information</h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Update the user's personal details</p>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <FieldBox label="First name" req>
                  <input className={inputCls} value={form.first_name} placeholder="First name"
                    onChange={e => setForm(s => ({ ...s, first_name: e.target.value }))} />
                </FieldBox>

                <FieldBox label="Middle name">
                  <input className={inputCls} value={form.middle_name} placeholder="Middle name"
                    onChange={e => setForm(s => ({ ...s, middle_name: e.target.value }))} />
                </FieldBox>

                <FieldBox label="Last name" req>
                  <input className={inputCls} value={form.last_name} placeholder="Last name"
                    onChange={e => setForm(s => ({ ...s, last_name: e.target.value }))} />
                </FieldBox>

                <FieldBox label="Username" req>
                  <div className="relative">
                    <AtSign size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className={`${inputCls} pl-9`} value={form.username} placeholder="username"
                      onChange={e => setForm(s => ({ ...s, username: e.target.value }))} />
                  </div>
                </FieldBox>

                <FieldBox label="Email address" req>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className={`${inputCls} pl-9`} type="email" value={form.email} placeholder="email@example.com"
                      onChange={e => setForm(s => ({ ...s, email: e.target.value }))} />
                  </div>
                </FieldBox>

                <FieldBox label="Account status">
                  <div className="relative">
                    <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none ${STATUS_META[form.status]?.dot || "bg-slate-400"}`} />
                    <select
                      className={`${selectCls} pl-8`}
                      value={form.status}
                      onChange={e => setForm(s => ({ ...s, status: e.target.value }))}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </FieldBox>

                <FieldBox label="Assigned role">
                  <div className="relative">
                    <Shield size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select className={`${selectCls} pl-9`} value={form.role_id}
                      onChange={e => setForm(s => ({ ...s, role_id: e.target.value }))}>
                      <option value="">No Role</option>
                      {roles.map(r => <option key={r._id} value={String(r._id)}>{r.role}</option>)}
                    </select>
                  </div>
                </FieldBox>

                <div className="md:col-span-2">
                  <FieldBox label="Bio">
                    <textarea
                      rows={3}
                      className={`${inputCls} resize-none`}
                      value={form.Bio}
                      placeholder="A short bio about this user…"
                      onChange={e => setForm(s => ({ ...s, Bio: e.target.value }))}
                    />
                  </FieldBox>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-900/40 rounded-b-2xl flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-extrabold shadow-md shadow-orange-200 dark:shadow-orange-900/30 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {updateMutation.isPending ? "Saving…" : "Save profile"}
                </button>
              </div>
            </div>

            {/* Sidebar snapshot */}
            <div className="space-y-5">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                    <Sparkles size={13} className="text-orange-500" />
                  </div>
                  <h4 className="text-[12px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">Account snapshot</h4>
                </div>
                <InfoRow icon={Mail}         label="Email"    value={form.email    || "N/A"} />
                <InfoRow icon={AtSign}        label="Username" value={form.username || "N/A"} />
                <InfoRow icon={BadgeCheck}    label="Role"     value={selectedRole?.role || "No role"} />
                <InfoRow icon={CalendarClock} label="Joined"   value={fmtDate(userData?.createdAt)} />
              </div>

              {/* Quick status card */}
              <div className={`rounded-2xl border p-5 ${statusMeta.pill}`}>
                <p className="text-[10.5px] font-extrabold uppercase tracking-widest mb-2 opacity-70">Account status</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusMeta.dot}`} />
                  <span className="text-[16px] font-extrabold">{form.status}</span>
                </div>
                <p className="text-[11.5px] mt-1.5 opacity-70">
                  {form.status === "Active"   ? "This account can log in and use the platform."  : ""}
                  {form.status === "Inactive" ? "This account is disabled and cannot log in."    : ""}
                  {form.status?.toLowerCase() === "pending" ? "Awaiting email verification or admin approval." : ""}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 
            SECURITY TAB
         */}
        {activeTab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                  <Lock size={14} className="text-orange-500" />
                </div>
                <div>
                  <h3 className="text-[14px] font-extrabold text-slate-900 dark:text-white">Password & access</h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Reset the user's password as admin</p>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* New password */}
                <FieldBox label="New password" req>
                  <div className="relative">
                    <KeyRound size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      className={`${inputCls} pl-9 pr-10`}
                      type={showNewPass ? "text" : "password"}
                      value={passwordData.newPassword}
                      placeholder="Enter new password"
                      onChange={e => setPasswordData(s => ({ ...s, newPassword: e.target.value }))}
                    />
                    <button type="button" onClick={() => setShowNewPass(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                      {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </FieldBox>

                {/* Confirm password */}
                <FieldBox label="Confirm password" req>
                  <div className="relative">
                    <KeyRound size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      className={`${inputCls} pl-9 pr-10`}
                      type={showConfPass ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      placeholder="Confirm new password"
                      onChange={e => setPasswordData(s => ({ ...s, confirmPassword: e.target.value }))}
                    />
                    <button type="button" onClick={() => setShowConfPass(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                      {showConfPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {/* match indicator */}
                  {passwordData.confirmPassword && (
                    <p className={`text-[11.5px] mt-1.5 flex items-center gap-1.5 font-semibold
                      ${passwordData.newPassword === passwordData.confirmPassword ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                      {passwordData.newPassword === passwordData.confirmPassword
                        ? <><CheckCircle2 size={11} /> Passwords match</>
                        : <><span className="text-red-400">✕</span> Passwords don't match</>
                      }
                    </p>
                  )}
                </FieldBox>

                {/* Force change checkbox */}
                <div className="md:col-span-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={passwordData.mustChangePassword}
                        onChange={e => setPasswordData(s => ({ ...s, mustChangePassword: e.target.checked }))}
                      />
                      <div
                        onClick={() => setPasswordData(s => ({ ...s, mustChangePassword: !s.mustChangePassword }))}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer
                          ${passwordData.mustChangePassword
                            ? "bg-orange-500 border-orange-500"
                            : "border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 group-hover:border-orange-300"
                          }`}
                      >
                        {passwordData.mustChangePassword && <Check size={11} className="text-white" strokeWidth={3} />}
                      </div>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">Force password change on next login</p>
                      <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-0.5">The user will be required to set a new password when they next log in.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-900/40 rounded-b-2xl flex justify-end">
                <button
                  onClick={handlePasswordUpdate}
                  disabled={passwordMutation.isPending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-extrabold shadow-md shadow-orange-200 dark:shadow-orange-900/30 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {passwordMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                  {passwordMutation.isPending ? "Updating…" : "Update password"}
                </button>
              </div>
            </div>

            {/* Security sidebar */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm p-5 h-fit">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                  <Shield size={13} className="text-orange-500" />
                </div>
                <h4 className="text-[12px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">Security info</h4>
              </div>
              <div className="flex flex-col gap-3 text-[12.5px] text-slate-600 dark:text-slate-300">
                {[
                  { icon: Lock,   label: "Password last set",  value: fmtDate(userData?.lastPasswordChange) },
                  { icon: Shield, label: "Role",               value: selectedRole?.role || "No role"       },
                  { icon: BadgeCheck, label: "Status",         value: form.status                          },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-gray-800 last:border-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      <Icon size={12} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
                      <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40">
                <p className="text-[11.5px] font-semibold text-orange-700 dark:text-orange-300 leading-relaxed">
                  Resetting a password as admin will immediately revoke existing sessions for this user.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* tiny helper — fix double status select */
function Check({ size, className, strokeWidth }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}