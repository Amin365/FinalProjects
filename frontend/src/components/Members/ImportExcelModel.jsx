import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import * as XLSX from "xlsx";
import { UploadCloud, X, AlertCircle, CheckCircle, Info } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import api from "@/app/api/apislice";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const REQUIRED_HEADERS = [
  "first_name",
  "middle_name",
  "last_name",
  "email",
  "phone",
  "department",
  "student_id",
  "study_year",
  "gender",
  "region",
  "city",
  "status",
  "date_of_birth",
  "join_date",
];

const IMPORT_ACCEPT = ".csv,.tsv,.xlsx,.xls";

const statusIconsMap = {
  info: Info,
  success: CheckCircle,
  error: AlertCircle,
};

const statusTone = {
  info: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-900",
  success: "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-900",
  error: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-900",
};

const dropAreaBaseClass =
  "flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl cursor-pointer transition-all outline-none";

function getDropAreaClass({ isDragging, file }) {
  return [
    dropAreaBaseClass,
    isDragging
      ? "border-orange-500 bg-muted"
      : file
      ? "border-green-500 bg-green-50 dark:bg-green-950"
      : "border-border hover:border-orange-500 hover:bg-muted",
  ].join(" ");
}

const normalizeKey = (key) => String(key || "").toLowerCase().trim().replace(/\s+/g, "_");

function ImportMembersExcelModal({ isOpen, onClose, refreshTable }) {
  const qc = useQueryClient();

  const [file, setFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [isDragging, setIsDragging] = useState(false);
  const [focusOnClose, setFocusOnClose] = useState(false);

  const dropRef = useRef(null);
  const fileInputRef = useRef(null);
  const closeBtnRef = useRef(null);

  const bulkCreateMembers = useMutation({
    mutationFn: async (members) => {
      const res = await api.post("/members/bulk", { members });
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["members"] });
      refreshTable?.();

      const msg =
        data?.message ||
        `Imported. Inserted: ${data?.insertedCount ?? 0}, Skipped: ${data?.skippedCount ?? 0}, Errors: ${
          data?.errorCount ?? 0
        }`;

      setStatusMessage(msg);
      setStatusType("success");
      toast.success(msg);

      setFile(null);
      setTimeout(() => onClose?.(), 1200);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || "API Error: could not complete bulk creation.";
      setStatusMessage(msg);
      setStatusType("error");
      toast.error(msg);
    },
  });

  useLayoutEffect(() => {
    if (isOpen && closeBtnRef.current) closeBtnRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setStatusMessage("");
      setStatusType("info");
      setFocusOnClose(false);
    }
  }, [isOpen]);

  const handleCancel = useCallback(() => {
    setFile(null);
    setStatusMessage("");
    setStatusType("info");
    setFocusOnClose(true);
    onClose?.();
  }, [onClose]);

  const handleClickDropArea = useCallback(() => {
    if (!bulkCreateMembers.isPending && fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }, [bulkCreateMembers.isPending]);

  const validateFile = useCallback((selectedFile) => {
    if (!selectedFile) return null;

    const extension = selectedFile.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv", "tsv"].includes(extension)) {
      const msg = "Unsupported file format. Please upload .xlsx, .xls, .csv, or .tsv.";
      setStatusMessage(msg);
      setStatusType("error");
      setFile(null);
      toast.error(msg);
      return null;
    }

    const msg = `Ready to upload: ${selectedFile.name}`;
    setStatusMessage(msg);
    setStatusType("info");
    setFile(selectedFile);
    toast(msg);
    return selectedFile;
  }, []);

  const handleFileChange = (e) => validateFile(e.target.files[0]);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      validateFile(e.dataTransfer.files && e.dataTransfer.files[0]);
    },
    [validateFile]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const parseFileToMembers = useCallback((data, extension) => {
    const workbook = XLSX.read(data, {
      type: ["xlsx", "xls"].includes(extension) ? "array" : "string",
      raw: true,
    });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const options = { defval: null };
    if (extension === "tsv") options.FS = "\t";

    const rows = XLSX.utils.sheet_to_json(worksheet, options);

    const members = rows
      .map((raw) => {
        const obj = {};
        for (const k in raw) {
          const nk = normalizeKey(k);
          if (REQUIRED_HEADERS.includes(nk)) obj[nk] = raw[k];
        }

        const first_name = String(obj.first_name || "").trim();
        const last_name = String(obj.last_name || "").trim();
        if (!first_name || !last_name) return null;

        if (obj.date_of_birth) obj.date_of_birth = new Date(obj.date_of_birth);
        if (obj.join_date) obj.join_date = new Date(obj.join_date);

        return {
          first_name,
          middle_name: String(obj.middle_name || "").trim(),
          last_name,
          email: obj.email ? String(obj.email).trim().toLowerCase() : "",
          phone: obj.phone ? String(obj.phone).trim() : "",
          department: obj.department ? String(obj.department).trim() : "",
          student_id: obj.student_id ? String(obj.student_id).trim() : "",
          study_year: obj.study_year ? String(obj.study_year).trim() : "",
          gender: obj.gender ? String(obj.gender).trim() : undefined,
          region: obj.region ? String(obj.region).trim() : "",
          city: obj.city ? String(obj.city).trim() : "",
          status: obj.status ? String(obj.status).trim() : undefined,
          date_of_birth: obj.date_of_birth || null,
          join_date: obj.join_date || undefined,
        };
      })
      .filter(Boolean);

    return members;
  }, []);

  const handleUpload = useCallback(() => {
    if (!file || bulkCreateMembers.isPending) return;

    setStatusMessage("Processing file...");
    setStatusType("info");

    const extension = file.name.split(".").pop().toLowerCase();
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = event.target.result;
        const members = parseFileToMembers(data, extension);

        if (!members.length) {
          const msg = "No valid member data found in the file (first_name + last_name required).";
          setStatusMessage(msg);
          setStatusType("error");
          toast.error(msg);
          return;
        }

        const msg = `Found ${members.length} records. Uploading...`;
        setStatusMessage(msg);
        setStatusType("info");
        toast(msg);

        bulkCreateMembers.mutate(members);
      } catch (err) {
        const msg = `File Error: ${err.message}`;
        setStatusMessage(msg);
        setStatusType("error");
        toast.error(msg);
      }
    };

    reader.onerror = () => {
      const msg = "Failed to read the file.";
      setStatusMessage(msg);
      setStatusType("error");
      toast.error(msg);
    };

    if (["xlsx", "xls"].includes(extension)) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  }, [file, bulkCreateMembers, parseFileToMembers]);

  const handleDropAreaKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") handleClickDropArea();
  };

  useEffect(() => {
    if (focusOnClose && closeBtnRef.current) {
      closeBtnRef.current.focus();
      setFocusOnClose(false);
    }
  }, [focusOnClose]);

  if (!isOpen) return null;

  const StatusIcon = statusIconsMap[statusType] || Info;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <Card className="relative w-full max-w-lg shadow-2xl border border-border bg-card text-card-foreground flex flex-col px-4 py-2">
        <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
          <h2 className="text-xl font-bold">Bulk Members Import</h2>

          <Button
            ref={closeBtnRef}
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close modal"
            onClick={handleCancel}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div
          ref={dropRef}
          tabIndex={0}
          role="button"
          aria-label="Upload or drop a file"
          onClick={handleClickDropArea}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onKeyDown={handleDropAreaKeyDown}
          className={getDropAreaClass({ isDragging, file })}
        >
          <UploadCloud size={48} className="text-orange-600 dark:text-orange-500 mb-3" aria-hidden="true" />
          <p className="text-lg font-semibold text-center">
            {file ? file.name : "Click or drag & drop file to import"}
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Supported formats: .xlsx, .xls, .csv, .tsv
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={IMPORT_ACCEPT}
            onChange={handleFileChange}
            className="hidden"
            disabled={bulkCreateMembers.isPending}
            tabIndex={-1}
            aria-label="Select file to import"
          />
        </div>

        <div className={`mt-4 p-3 rounded-xl flex items-center gap-3 ${statusTone[statusType]}`} aria-live="assertive">
          <StatusIcon size={20} aria-hidden="true" />
          <p className="text-sm font-medium">
            {statusMessage.length ? statusMessage : "Please upload a file to import"}
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={handleCancel} disabled={bulkCreateMembers.isPending} type="button">
            Cancel
          </Button>

          <Button
            onClick={handleUpload}
            disabled={!file || bulkCreateMembers.isPending || statusType === "success"}
            type="button"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <UploadCloud className="h-4 w-4 mr-2" />
            {bulkCreateMembers.isPending ? "Uploading..." : "Start Import"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default ImportMembersExcelModal;