import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  Save,
  Users,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Loader,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import api from "@/app/api/apislice";
import { toast } from "sonner";

// Local Card (glassmorphism)
const Card = ({ children, className = "" }) => (
  <div
    className={`backdrop-blur-md bg-white/80 dark:bg-gray-900/80 p-8 rounded-2xl shadow-2xl border border-slate-200/70 dark:border-gray-700/80 ${className}`}
  >
    {children}
  </div>
);

const MembersForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const activeId = id ?? null;
  const isEditMode = Boolean(activeId);

  const [step, setStep] = useState(1);
  const qc = useQueryClient();

  // Fetch member when editing
  const { data: fetchedMemberData, isLoading: isFetchingMember } = useQuery({
    queryKey: ["member", activeId],
    enabled: Boolean(activeId),
    queryFn: async () => {
      const resp = await api.get(`/members/${activeId}`);
      return resp.data?.data ?? resp.data;
    },
    staleTime: 30_000,
  });

  // Fetch roles
  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const resp = await api.get("/roles");
      return resp.data?.data ?? resp.data ?? [];
    },
    staleTime: 30_000,
  });

  const roleOptions = useMemo(() => {
    const roles = Array.isArray(rolesData) ? rolesData : [];
    return roles.map((r) => ({
      value: r._id,
      label: r.role,
    }));
  }, [rolesData]);

  // create & update mutations (expect FormData)
  const createMutation = useMutation({
    mutationFn: async (formData) => {
      const resp = await api.post("/members", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return resp.data?.data ?? resp.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["members"] });
      toast.success(
        `Member "${data.first_name || ""} ${data.last_name || ""}" created successfully.`
      );
      resetFormAfterSuccess();
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to create member";
      toast.error(msg);
      console.error(err);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id: memberId, formData }) => {
      const resp = await api.put(`/members/${memberId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return resp.data?.data ?? resp.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["member", data._id ?? data.id] });
      toast.success(`Member updated successfully.`);
      resetFormAfterSuccess();
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to update member";
      toast.error(msg);
      console.error(err);
    },
  });

  const isProcessing = createMutation.isLoading || updateMutation.isLoading;

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    reset,
    watch,
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      first_name: "",
      middle_name: "",
      last_name: "",
      phone: "",
      email: "",
      gender: "Male",
      region: "",
      join_date: "",
      notes: "",
      emergency_contact: "",
      alt_phone: "",
      alt_email: "",
      status: "Active",

      department: "",
      student_id: "",
      study_year: "",
      profile_picture: "",

      // IMPORTANT: role field
      role: "",
    },
  });

  // State for current profile picture URL (for edit mode preview)
  const [currentProfilePicture, setCurrentProfilePicture] = useState(null);

  // populate form when editing
  useEffect(() => {
    if (isEditMode && fetchedMemberData) {
      const m = fetchedMemberData;

      // Set current profile picture for preview
      setCurrentProfilePicture(m.profile_picture || m.Profile_picture || null);

      reset({
        first_name: m.first_name || "",
        middle_name: m.middle_name || "",
        last_name: m.last_name || "",
        phone: m.phone || "",
        email: m.email || "",
        gender: m.gender || "Male",
        region: m.region || "",
        join_date: m.join_date ? m.join_date.split?.("T")[0] : "",
        notes: m.notes || "",
        emergency_contact: m.emergency_contact || "",
        alt_phone: m.alt_phone || "",
        alt_email: m.alt_email || "",
        status: m.status || "Active",

        department: m.department || "",
        student_id: m.student_id || "",
        study_year: m.study_year ?? "",
        // Do NOT set profile_picture here to avoid string value in file input

        // IMPORTANT: role could be populated object or string id
        role: m.role?._id || m.role || "",
      });
    }
  }, [fetchedMemberData, isEditMode, reset]);

  const resetFormAfterSuccess = () => {
    reset();
    setStep(1);
    setCurrentProfilePicture(null); // Reset the preview state
    setTimeout(() => {
      navigate("/");
    }, 1000);
  };

  const nextStep = async (e, fieldsToValidate) => {
    e.preventDefault();
    const isValid = await trigger(fieldsToValidate);
    if (isValid) setStep((prev) => prev + 1);
  };

  const prevStep = (e) => {
    e.preventDefault();
    setStep((prev) => Math.max(1, prev - 1));
  };

  const onSubmitHandler = async (data) => {
    // Build FormData for multipart/form-data (handles profile picture file)
    const formData = new FormData();

    // Append simple fields (only if present)
    const appendIfPresent = (key, value) => {
      if (typeof value === "undefined" || value === null) return;
      // Avoid appending empty strings
      if (typeof value === "string" && value.trim() === "") return;
      formData.append(key, value);
    };

    appendIfPresent("first_name", data.first_name);
    appendIfPresent("middle_name", data.middle_name);
    appendIfPresent("last_name", data.last_name);
    appendIfPresent("phone", data.phone);
    appendIfPresent("email", data.email);
    appendIfPresent("gender", data.gender);
    appendIfPresent("region", data.region);
    appendIfPresent("join_date", data.join_date ? new Date(data.join_date).toISOString() : undefined);
    appendIfPresent("notes", data.notes);
    appendIfPresent("emergency_contact", data.emergency_contact);
    appendIfPresent("alt_phone", data.alt_phone);
    appendIfPresent("alt_email", data.alt_email);
    appendIfPresent("status", data.status);

    appendIfPresent("department", data.department);
    appendIfPresent("student_id", data.student_id);
    appendIfPresent("study_year", data.study_year);

    // role
    appendIfPresent("role", data.role || "");

    // profile picture (file input)
    // react-hook-form returns FileList for file inputs
    if (data.profile_picture && data.profile_picture.length > 0) {
      const file = data.profile_picture[0];
      formData.append("profile_picture", file, file.name);
    } else {
      // If editing and no new file was supplied, don't append — server should keep existing
      // Optionally, if your server expects an explicit URL override, you could append it:
      // if (isEditMode && fetchedMemberData?.profile_picture) {
      //   formData.append("profile_picture_url", fetchedMemberData.profile_picture);
      // }
    }

    try {
      if (isEditMode && activeId) {
        await updateMutation.mutateAsync({ id: activeId, formData });
        return;
      }
      await createMutation.mutateAsync(formData);
    } catch (err) {
      console.error("Member submit error:", err);
    }
  };

  const Field = ({
    label,
    name,
    type = "text",
    placeholder,
    validation,
    helperText,
    ...rest
  }) => (
    <div className="relative w-full mb-6 group">
      <label
        htmlFor={name}
        className={`block text-sm font-semibold tracking-wide mb-1 ${
          errors[name] ? "text-red-500" : "text-slate-600 dark:text-slate-300"
        }`}
      >
        {label} {validation?.required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        type={type}
        {...register(name, validation)}
        placeholder={placeholder || ""}
        className={`
          w-full px-3 py-2.5 rounded-xl text-sm md:text-base
          border ${errors[name] ? "border-red-500 ring-1 ring-red-300" : "border-slate-200 dark:border-gray-700"}
          bg-white/80 dark:bg-gray-900/70
          text-slate-800 dark:text-gray-100
          shadow-sm
          focus:outline-none focus:ring-2 focus:ring-orange-400/60 focus:border-orange-500
          transition-all duration-200
        `}
        {...rest}
      />
      {helperText && !errors[name] && (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {helperText}
        </p>
      )}
      {errors[name] && (
        <p className="mt-1 text-xs text-red-500">{errors[name].message}</p>
      )}
    </div>
  );

  const SelectField = ({
    label,
    name,
    options,
    validation,
    helperText,
    disabled,
  }) => (
    <div className="relative w-full mb-6 group">
      <label
        htmlFor={name}
        className={`block text-sm font-semibold tracking-wide mb-1 ${
          errors[name] ? "text-red-500" : "text-slate-600 dark:text-slate-300"
        }`}
      >
        {label} {validation?.required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <select
          id={name}
          {...register(name, validation)}
          disabled={disabled}
          className={`
            w-full px-3 py-2.5 rounded-xl text-sm md:text-base
            border ${errors[name] ? "border-red-500 ring-1 ring-red-300" : "border-slate-200 dark:border-gray-700"}
            bg-white/80 dark:bg-gray-900/70
            text-slate-800 dark:text-gray-100
            shadow-sm
            focus:outline-none focus:ring-2 focus:ring-orange-400/60 focus:border-orange-500
            transition-all duration-200
            appearance-none cursor-pointer
            ${disabled ? "opacity-60 cursor-not-allowed" : ""}
          `}
        >
          <option value="" disabled hidden className="text-slate-400">
            Select {label}...
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-slate-800">
              {opt.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
          ▼
        </span>
      </div>

      {helperText && !errors[name] && (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {helperText}
        </p>
      )}
      {errors[name] && (
        <p className="mt-1 text-xs text-red-500">{errors[name].message}</p>
      )}
    </div>
  );

  // validate role in step 2 so you can't continue without picking it (optional)
  const stepFields = {
    1: ["first_name", "last_name", "email", "gender"],
    2: ["join_date", "region", "role"], // <-- role required here if you want
    3: [],
  };

  // Watch profile_picture to show preview of newly selected file
  const watchedProfile = watch("profile_picture");
  const previewSrc = watchedProfile && watchedProfile.length > 0
    ? URL.createObjectURL(watchedProfile[0])
    : currentProfilePicture;

  const stepComponents = {
    1: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
        <Field
          label="First Name"
          name="first_name"
          validation={{ required: "First Name is required." }}
        />
        <Field label="Middle Name" name="middle_name" />
        <Field
          label="Last Name"
          name="last_name"
          validation={{ required: "Last Name is required." }}
        />
        <SelectField
          label="Gender"
          name="gender"
          options={[
            { value: "Male", label: "Male" },
            { value: "Female", label: "Female" },
            // { value: "Other", label: "Other" },
          ]}
          validation={{ required: "Gender is required." }}
        />
        <Field
          label="Email Address"
          name="email"
          type="email"
          validation={{
            required: "Email is required.",
            pattern: { value: /^\S+@\S+$/i, message: "Invalid email address." },
          }}
        />
        <Field label="Phone Number" name="phone" type="tel" />
        <Field label="Region" name="region" />
      </div>
    ),
    2: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
        <Field
          label="Join Date"
          name="join_date"
          type="date"
          validation={{ required: "Join Date is required." }}
        />

        {/* IMPORTANT: Role selection */}
        <SelectField
          label="Role"
          name="role"
          options={roleOptions}
          disabled={isLoadingRoles}
          validation={{ required: "Role is required." }}
          helperText={
            isLoadingRoles
              ? "Loading roles..."
              : "Choose the member role (linked to Role collection)."
          }
        />

        <Field
          label="Department"
          name="department"
          helperText="e.g. Computer Science, Literature"
        />
        <Field
          label="Student / Member ID"
          name="student_id"
          helperText="Institutional ID if applicable"
        />

        <div className="sm:col-span-2">
          <SelectField
            label="Study Year"
            name="study_year"
            options={[
              { value: "", label: "Not applicable" },
              { value: "1", label: "1st Year" },
              { value: "2", label: "2nd Year" },
              { value: "3", label: "3rd Year" },
              { value: "4", label: "4th Year" },
              { value: "5", label: "5th Year" },
            ]}
            helperText="Select academic year (if member is a student)."
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Notes (optional)
          </label>
          <textarea
            {...register("notes")}
            className="w-full mt-2 p-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 text-sm dark:text-gray-100"
          />
        </div>
      </div>
    ),
    3: (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
          <Field label="Emergency Contact" name="emergency_contact" />
          <Field label="Phone (alt)" name="alt_phone" />
          <Field label="Email (alt)" name="alt_email" type="email" />
        </div>

        <div className="pt-4 border-t border-slate-200/70 dark:border-gray-700/60">
          <label className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Member Status
          </label>
          <div className="flex flex-wrap gap-4">
            {["Active", "Inactive"].map((status) => (
              <label
                key={status}
                className="flex items-center gap-3 cursor-pointer px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 hover:bg-slate-100/80 dark:hover:bg-gray-800/80 transition-colors"
              >
                <input
                  type="radio"
                  value={status}
                  {...register("status")}
                  className="h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {status}
                </span>
              </label>
            ))}
          </div>

          {/* Profile picture input + preview */}
          <div className="mt-6">
            <label className="block text-sm font-semibold mb-2">Profile picture</label>
            <input
              type="file"
              accept="image/*"
              {...register("profile_picture")}
              className="w-full"
            />
            {previewSrc && (
              <img
                src={previewSrc}
                alt="profile preview"
                className="mt-3 w-28 h-28 object-cover rounded-full border border-slate-200"
              />
            )}
            <p className="mt-2 text-xs text-slate-400">Optional: upload a square image for best results.</p>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
       <div className="flex justify-between items-start mb-10 gap-4">
  <div>
    <h1 className="text-xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
      {isEditMode ? "Update Member" : "New Member Registration"}
    </h1>

    <p className="mt-2 text-sm text-slate-500 max-w-xl">
      Capture personal, membership and education details in a guided flow.
    </p>
  </div>

  <button
    type="button"
    onClick={() => navigate("/")}
    className="flex items-center gap-2 px-4 py-2.5 bg-white/80 text-slate-600 
    shadow-lg hover:bg-slate-100 rounded-xl border border-slate-200/70 
    transition-all text-xs md:text-sm font-semibold whitespace-nowrap"
  >
    <ChevronLeft size={18} />
    <span>Back to List</span>
  </button>
</div>


        <div className="flex justify-between items-center mb-10">
          {[
            { step: 1, name: "Personal Info", Icon: Users },
            { step: 2, name: "Membership & Education", Icon: Save },
            { step: 3, name: "Extras", Icon: Save },
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center flex-1">
              <div
                className={`flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-full border transition-all duration-300 ${
                  step === s.step
                    ? "bg-orange-600 text-white border-orange-500 shadow-xl scale-105"
                    : step > s.step
                    ? "bg-emerald-50 text-emerald-600 border-emerald-300"
                    : "bg-slate-200 text-slate-500 border-slate-300"
                }`}
              >
                {step > s.step ? <CheckCircle size={18} /> : <s.Icon size={18} />}
              </div>
              <p
                className={`mt-2 text-xs md:text-sm text-center font-medium ${
                  step === s.step ? "text-orange-600" : "text-slate-500"
                }`}
              >
                {s.name}
              </p>
            </div>
          ))}
        </div>

        <Card className="min-h-[420px]">
          {isEditMode && isFetchingMember ? (
            <div className="flex flex-col gap-3 justify-center items-center h-40">
              <Loader className="animate-spin text-orange-600" size={36} />
              <p className="text-sm text-slate-500">Loading member details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmitHandler)}>
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  Step {step}{" "}
                  <span className="text-sm md:text-base font-normal text-slate-500">
                    {step === 1
                      ? "Personal Information"
                      : step === 2
                      ? "Membership & Education"
                      : "Extras & Status"}
                  </span>
                </h2>
                <span className="text-xs md:text-sm text-slate-400">
                  {step} / 3
                </span>
              </div>

              {stepComponents[step]}

             <div className="flex justify-between mt-10 pt-6 border-t border-slate-200/70">
  {step > 1 ? (
    <button
      type="button"
      onClick={prevStep}
      disabled={isProcessing}
      className="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm md:text-base 
      font-semibold rounded-xl hover:bg-slate-100/80 transition-colors 
      flex items-center gap-2 shadow-sm disabled:opacity-60 whitespace-nowrap"
    >
      <ChevronLeft size={18} />
      Previous
    </button>
  ) : (
    <div />
  )}

  {step < 3 ? (
    <button
      type="button"
      onClick={(e) => nextStep(e, stepFields[step])}
      disabled={isProcessing}
      className="px-6 py-2.5 bg-orange-600 text-white text-sm md:text-base 
      font-semibold rounded-xl hover:bg-orange-700 transition-colors 
      flex items-center gap-2 shadow-lg disabled:opacity-60 whitespace-nowrap"
    >
      Next Step
      <ChevronRight size={18} />
    </button>
  ) : (
    <button
      type="submit"
      disabled={isProcessing}
      className="px-7 py-2.5 bg-emerald-600 text-white text-sm md:text-base 
      font-semibold rounded-xl hover:bg-emerald-700 transition-colors 
      flex items-center gap-2 shadow-lg shadow-emerald-300/60 
      disabled:opacity-60 whitespace-nowrap"
    >
      {isProcessing ? (
        <>
          <Loader size={18} className="animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Save size={18} />
          {isEditMode ? "Update Member" : "Finalize & Save"}
        </>
      )}
    </button>
  )}
</div>

            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MembersForm;