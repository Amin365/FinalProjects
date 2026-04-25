import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Lock,
  Trash2,
  Save,
  Edit,
  X,
  FileText,
  Laptop,
  Smartphone,
  Camera,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import api from "@/app/api/apislice";
import Loader from "../Loader";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user: reduxUser } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();

  // Query user data
  const { data: user, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/profile');
      return res.data.data || res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  console.log('users',user)

  const [editMode, setEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Profile form state (sync to loaded user)
  const [tempData, setTempData] = useState({
    name: "",
    bio: "",
    phone: "",
    profile: "",
    preview: "",
  });

  useEffect(() => {
    if (user) {
      setTempData({
        name: [user.first_name, user.last_name].filter(Boolean).join(" ").trim(),
        bio: user.Bio || "",
        phone: user.phone || "",
        profile: user.profile_picture || "",
        preview: "",
      });
    }
  }, [user]);

  // Device detection for fun
  const [loginDevices, setLoginDevices] = useState([]);
  useEffect(() => {
    const getDeviceInfo = () => {
      const ua = navigator.userAgent;
      const deviceType = /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle/.test(ua) ? "Mobile" : "Desktop";
      const browser = (() => {
        if (ua.includes("Chrome")) return "Chrome";
        if (ua.includes("Firefox")) return "Firefox";
        if (ua.includes("Safari")) return "Safari";
        if (ua.includes("Edge")) return "Edge";
        return "Unknown";
      })();
      const os = (() => {
        if (ua.includes("Win")) return "Windows";
        if (ua.includes("Mac")) return "macOS";
        if (ua.includes("Linux")) return "Linux";
        if (/Android/.test(ua)) return "Android";
        if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
        return "Unknown";
      })();
      return [
        {
          id: 1,
          device: `${os} - ${browser}`,
          type: deviceType,
          active: true,
          time: new Date().toLocaleString(),
        },
      ];
    };
    setLoginDevices(getDeviceInfo());
  }, []);

  // Profile completion logic
  const calculateCompletion = () => {
    let filled = 0;
    const total = 3;
    if (tempData.profile || user?.profile_picture) filled++;
    if (tempData.bio || user?.Bio) filled++;
    if (tempData.phone || user?.phone) filled++;
    return Math.round((filled / total) * 100);
  };
  const [profileCompletion, setProfileCompletion] = useState(calculateCompletion());
  useEffect(() => {
    setProfileCompletion(calculateCompletion());
  }, [tempData, user]);

  // Avatar picker
  // const handlePhotoChange = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     setTempData({ ...tempData, profile: file, preview: URL.createObjectURL(file) });
  //   }
  // };

  const MAX_MB = 10; // whatever you allow
const handlePhotoChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Image too large. Please select a photo under ${MAX_MB}MB.`);
      return;
    }
    setTempData({ ...tempData, profile: file, preview: URL.createObjectURL(file) });
  }
};

  // Mutation for profile update
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();
      if (data.name) formData.append("name", data.name);
      if (data.bio !== undefined) formData.append("bio", data.bio);
      if (data.phone !== undefined) formData.append("phone", data.phone);
      if (data.profile && data.profile instanceof File) {
        formData.append("profile", data.profile); // must match multer field in backend
      }
      const res = await api.put("/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data || res.data;

      
    },
    onSuccess: (data) => {
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries(["profile"]);
      setEditMode(false);
      setTempData({
        name: [data.first_name, data.last_name].filter(Boolean).join(" ").trim(),
        bio: data.Bio || "",
        phone: data.phone || "",
        profile: data.profile_picture || "",
        preview: "",
      });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to update profile."),
  });

  // Mutation for delete
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete("/profile/delete");
    },
    onSuccess: () => {
      toast.success("Account deleted successfully!");
      localStorage.removeItem("token");
      window.location.href = "/login";
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to delete account."),
  });

  // Mutation for password change
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const passwordMutation = useMutation({
    mutationFn: async (pwds) => {
      const res = await api.put("/profile/change-password", pwds);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Password changed successfully!");
      setShowPasswordModal(false);
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to change password."),
  });

  if (isLoading) return <Loader />;

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100 flex items-center justify-center">
      <motion.div
        className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* LEFT PANEL */}
        <Card className="rounded-2xl shadow-md p-4 dark:bg-slate-800 md:col-span-1">
          <CardContent className="flex flex-col items-center space-y-4">
            {/* Profile Picture */}
            <div className="relative group">
              <img
                src={
                  tempData.preview ||
                  (user && user.profile_picture) || user.member?.profile_picture || ""
                }
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
              />
              {editMode && (
                <label className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center cursor-pointer text-white text-sm">
                  <Camera size={22} className="mb-1" />
                  Change
                  <input
                    type="file"
                    className="hidden"
                     accept="image/jpeg,image/png,image/heic,image/heif"
                    onChange={handlePhotoChange}
                  />
                </label>
              )}
            </div>
            {/* Basic Info */}
            <h2 className="text-2xl font-semibold">
              {editMode ? tempData.name : [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim()}
            </h2>
            <p className="text-gray-500 flex items-center gap-2">
              <Shield size={16} /> {user?.role?.role || "User"}
            </p>
            <p className="text-gray-500 flex items-center gap-2">
              <Calendar size={16} /> Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
            </p>
            {/* Profile Completion */}
            <div className="w-full border-t pt-4 space-y-2">
              <h3 className="text-lg font-semibold">Profile Completion</h3>
              <Progress value={profileCompletion} className="h-2" />
              <p className="text-sm text-gray-500">{profileCompletion}% Complete</p>
            </div>
            {/* Login Devices */}
            <div className="w-full border-t pt-4 space-y-3">
              <h3 className="text-lg font-semibold flex gap-2 items-center">
                <Laptop size={18} /> Login Devices
              </h3>
              {loginDevices.map((d) => (
                <div
                  key={d.id}
                  className={`p-3 rounded-xl flex items-center justify-between ${
                    d.active ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {d.type === "Mobile" ? <Smartphone size={16} /> : <Laptop size={16} />}
                    {d.device}
                  </div>
                  {d.active && <CheckCircle size={16} className="text-green-500" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT PANEL */}
        <Card className="md:col-span-2 rounded-2xl shadow-md dark:bg-slate-800">
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-2xl font-semibold hidden md:block">Profile Details</CardTitle>
            <div className="flex items-center gap-3">
              {!editMode && (
                <Button
                  onClick={() => navigate(`/dashboard/id-card/${user?.member?._id}`)}
                  variant="outline"
                  className="rounded-xl"
                >
                  View ID Card
                </Button>
              )}
              {!editMode ? (
                <Button onClick={() => setEditMode(true)} className="rounded-xl flex gap-2">
                  <Edit size={16} /> Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateMutation.mutate(tempData)}
                    className="rounded-xl flex gap-2"
                    disabled={updateMutation.isPending}
                  >
                    <Save size={16} />
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTempData({
                        name: [user.first_name, user.last_name].filter(Boolean).join(" ").trim(),
                        bio: user.Bio || "",
                        phone: user.phone || "",
                        profile: user.profile_picture || "",
                        preview: "",
                      });
                      setEditMode(false);
                    }}
                    className="rounded-xl flex gap-2"
                  >
                    <X size={16} /> Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: User, key: "name", label: "Full Name" },
                { icon: Mail, key: "email", label: "Email", disabled: true },
                { icon: Phone, key: "phone", label: "Phone" }
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-gray-500 flex items-center gap-2">
                    <f.icon size={16} /> {f.label}
                  </label>
                  <Input
                    disabled={f.disabled || !editMode}
                    value={
                      editMode
                        ? f.key === "email"
                          ? user?.email || ""
                          : tempData?.[f.key] ?? ""
                        : f.key === "name"
                          ? [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim()
                          : f.key === "email"
                            ? user?.email || ""
                            : user?.[f.key] || ""
                    }
                    onChange={
                      f.key === "email"
                        ? undefined
                        : (e) => setTempData({ ...tempData, [f.key]: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
            {/* Bio */}
            <div>
              <label className="text-gray-500 flex items-center gap-2">
                <FileText size={16} /> About Me
              </label>
              <Textarea
                disabled={!editMode}
                value={tempData.bio}
                onChange={(e) => setTempData({ ...tempData, bio: e.target.value })}
                className="mt-1"
              />
            </div>
            {/* Security */}
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-lg font-semibold">Security</h3>
              <Button variant="outline" className="w-full flex gap-2" onClick={() => setShowPasswordModal(true)}>
                <Lock size={16} /> Change Password
              </Button>
            </div>
            {/* Delete */}
            <div className="pt-4 border-t">
              <Button variant="destructive" className="w-full flex gap-2" onClick={() => setShowDeleteModal(true)}>
                <Trash2 size={16} /> Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modals */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            className="p-6 rounded-2xl w-96 bg-white text-gray-800 dark:bg-slate-800 dark:text-gray-100"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="text-xl font-semibold mb-3 flex gap-2">
              <Lock /> Change Password
            </h3>
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Current Password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              />
              <Input
                type="password"
                placeholder="New Password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              />
              <Input
                type="password"
                placeholder="Confirm New Password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => passwordMutation.mutate(passwords)} disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? "Changing..." : "Change"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            className="p-6 rounded-2xl w-96 bg-white text-gray-800 dark:bg-slate-800 dark:text-gray-100"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="text-xl font-semibold mb-3 flex gap-2">
              <Trash2 /> Confirm Delete
            </h3>
            <p className="text-sm mb-4 text-gray-500">
              Are you sure you want to permanently delete your account? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Preview ID Card (optional) */}
      {/* <div className="fixed bottom-6 right-6 z-50">
        // Render your PVCIDCard component if desired here
      </div> */}
    </div>
  );
}