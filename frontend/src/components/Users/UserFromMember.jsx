import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, KeyRound, UserPlus, Save, Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fetchMembers = async () => {
  // Updated to call the /available_members endpoint, which already excludes members with user accounts
  const res = await api.get("/available_members", { params: { page: 1, limit: 500, sort: "first_name" } });
  return res.data;
};

const StepPill = ({ active, done, title, subtitle, Icon }) => {
  return (
    <div
      className={cn(
        "flex items-center  gap-3 rounded-2xl border px-4 py-3 transition-all",
        active
          ? "border-orange-300 w-70 shadow-sm"
          : done
          ? "border-emerald-200  w-70"
          : "border-slate-200 dark:border-gray-700 w-70 dark:bg-gray-900"
      )}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center border",
          active
            ? "bg-orange-600  text-white border-orange-500"
            : done
            ? "bg-emerald-600 text-white border-emerald-500"
            : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
        )}
      >
        {done ? <CheckCircle2 size={18} /> : <Icon size={18} />}
      </div>

      <div className="min-w-0">
        <div className={cn("text-sm font-semibold truncate", active ? "text-orange-700" : "text-slate-800 dark:text-white")}>
          {title}
        </div>
        <div className="text-xs text-slate-500 dark:text-gray-300 truncate">{subtitle}</div>
      </div>
    </div>
  );
};

const CreateUserForm = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [step, setStep] = useState(1);

  const { data: membersResp, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["available_members", "user-create"],  // Updated query key to reflect the new endpoint
    queryFn: fetchMembers,
    staleTime: 30_000,
  });

  const members = useMemo(() => {
    if (Array.isArray(membersResp?.data)) return membersResp.data;
    if (Array.isArray(membersResp)) return membersResp;
    return [];
  }, [membersResp]);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      member: "",
      full_name: "",
      email: "",
      role_name: "",
      username: "",
      password: "",
    },
  });

  const memberId = watch("member");

  const selectedMember = useMemo(() => {
    if (!memberId) return null;
    return members.find((m) => m._id === memberId) || null;
  }, [members, memberId]);

  useEffect(() => {
    if (!selectedMember) {
      setValue("full_name", "");
      setValue("email", "");
      setValue("role_name", "");
      return;
    }

    const fullName =
      selectedMember.full_name ||
      [selectedMember.first_name, selectedMember.middle_name, selectedMember.last_name]
        .filter(Boolean)
        .join(" ");

    setValue("full_name", fullName);
    setValue("email", selectedMember.email || "");
    setValue("role_name", selectedMember.role?.role || "");

    // suggest username
    if (selectedMember.email) {
      setValue("username", selectedMember.email.split("@")[0]);
    } else if (selectedMember.code) {
      setValue("username", selectedMember.code.toLowerCase());
    }
  }, [selectedMember, setValue]);

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const resp = await api.post("/users", payload);
      return resp.data?.data ?? resp.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
      navigate("/dashboard/users");
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to create user";
      toast.error(msg);
      console.error(err);
    },
  });

  const goNext = async () => {
    const ok = await trigger(["member"]);
    if (!ok) return;

    if (selectedMember && !selectedMember.email) {
      toast.error("Selected member must have an email.");
      return;
    }

    setStep(2);
  };

  const goPrev = () => setStep(1);

  const onSubmit = async (data) => {
    const payload = {
      member: data.member,
      username: data.username,
      password: data.password,
    };
    await createMutation.mutateAsync(payload);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] p-4 dark:bg-gray-900 bg-slate-50">
      {/* Center container */}
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Create User</h1>
            <p className="text-sm mt-1 text-slate-500 dark:text-gray-300">
              Create a system account from an existing member.
            </p>
          </div>

          <Button variant="outline" onClick={() => navigate("/dashboard/users")}>
            <ArrowLeft size={16} /> <span className="ml-2">Back</span>
          </Button>
        </div>

        {/* Modern steps */}
        <div className="grid  grid-cols-1 mx-8 md:grid-cols-2 gap-3 mb-6">
          <StepPill
            active={step === 1}
            done={step > 1}
            title="Member details"
            subtitle="Pick member + preview info"
            Icon={UserPlus}
          />
          <StepPill
            active={step === 2}
            done={false}
            title="Credentials"
            subtitle="Set username & password"
            Icon={KeyRound}
          />
        </div>

        {/* Centered form card */}
        <div className="flex justify-center">
          <Card className="w-full max-w-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-white">
                {step === 1 ? "Step 1: Select Member" : "Step 2: Credentials"}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {step === 1 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Member Select */}
                      <div className="md:col-span-2">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
                          Member <span className="text-red-500">*</span>
                        </label>

                        <Select
                          value={memberId}
                          onValueChange={(v) => setValue("member", v, { shouldValidate: true })}
                          disabled={isLoadingMembers}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder={isLoadingMembers ? "Loading members..." : "Select member..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {members.map((m) => {
                              const fullName =
                                m.full_name ||
                                [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(" ");
                              const label = `${fullName}`;
                              return (
                                <SelectItem key={m._id} value={m._id}>
                                  {label}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>

                        {/* hidden input for RHF validation */}
                        <input type="hidden" {...register("member", { required: "Member is required" })} />
                        {errors.member && <p className="text-xs text-red-500 mt-2">{errors.member.message}</p>}
                      </div>

                      {/* Auto-filled */}
                      <div>
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">Full Name</label>
                        <Input readOnly className="mt-2 bg-slate-50 dark:bg-gray-800" {...register("full_name")} />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">Email</label>
                        <Input readOnly className="mt-2 bg-slate-50 dark:bg-gray-800" {...register("email")} />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">Role</label>
                        <Input readOnly className="mt-2 bg-slate-50 dark:bg-gray-800" {...register("role_name")} />
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
                          Role is copied from the selected member when the user is created.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => navigate("/dashboard/users")}>
                        Cancel
                      </Button>
                      <Button type="button" 
                      className="dark:bg-orange-600"
                      onClick={goNext} disabled={isLoadingMembers}>
                        Next <ChevronRight size={16} className="ml-2" />
                      </Button>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    {/* Summary (compact) */}
                    <div className="rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/40 p-4">
                      <div className="text-sm font-semibold text-slate-800 dark:text-white">Selected member</div>
                      <div className="text-xs text-slate-500 dark:text-gray-300 mt-1">
                        {watch("full_name") || "—"} • {watch("email") || "—"} • {watch("role_name") || "—"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
                          Username <span className="text-red-500">*</span>
                        </label>
                        <Input
                          className="mt-2"
                          placeholder="e.g amin365"
                          {...register("username", { required: "Username is required" })}
                        />
                        {errors.username && <p className="text-xs text-red-500 mt-2">{errors.username.message}</p>}
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <Input
                          className="mt-2"
                          type="password"
                          placeholder="Enter password"
                          {...register("password", {
                            required: "Password is required",
                            minLength: { value: 6, message: "Min 6 characters" },
                          })}
                        />
                        {errors.password && <p className="text-xs text-red-500 mt-2">{errors.password.message}</p>}
                      </div>
                    </div>

                    <div className="flex justify-between gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={goPrev}>
                        <ChevronLeft size={16} className="mr-2" /> Back
                      </Button>

                      <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => navigate("/dashboard/users")}>
                          Cancel
                        </Button>

                        <Button type="submit" disabled={createMutation.isPending}>
                          {createMutation.isPending ? (
                            <>
                              <Loader2 className="animate-spin" size={16} /> <span className="ml-2">Creating...</span>
                            </>
                          ) : (
                            <>
                              <Save size={16} /> <span className="ml-2">Create User</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateUserForm;