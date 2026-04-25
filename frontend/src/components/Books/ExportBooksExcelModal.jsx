import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { UploadCloud, X, AlertCircle, CheckCircle, Info, Download } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import api from "@/app/api/apislice";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const IMPORT_ACCEPT = ".csv,.tsv,.xlsx,.xls";

const statusIconsMap = {
  info: Info,
  success: CheckCircle,
  error: AlertCircle,
};

const statusTone = {
  info: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-900",
  success:
    "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-900",
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

/**
 * We match the backend controller:
 * - required: title
 * - optional: author, isbn (optional because backend auto-generates), BookType, status, totalPages, totalCopies, availableCopies, book_picture
 */
const ALLOWED_HEADERS = [
  "title",
  "author",
  "isbn",
  "booktype",
  "status",
  "totalpages",
  "totalcopies",
  "availablecopies",
  "book_picture",
];

function buildTemplateAndDownload() {
  const rows = [
    {
      title: "Clean Code",
      author: "Robert C. Martin",
      isbn: "", // optional (leave empty to auto-generate)
      BookType: "Programming",
      status: "available",
      totalPages: 464,
      totalCopies: 5,
      availableCopies: 5,
      book_picture: "https://...",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 26 }, // title
    { wch: 22 }, // author
    { wch: 14 }, // isbn
    { wch: 16 }, // BookType
    { wch: 12 }, // status
    { wch: 12 }, // totalPages
    { wch: 12 }, // totalCopies
    { wch: 16 }, // availableCopies
    { wch: 36 }, // book_picture
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Books");
  XLSX.writeFile(wb, "books-import-template.xlsx");
}

function ImportBooksExcelModal({ isOpen, onClose, refreshTable }) {
  const qc = useQueryClient();

  const [file, setFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [isDragging, setIsDragging] = useState(false);
  const [focusOnClose, setFocusOnClose] = useState(false);

  const dropRef = useRef(null);
  const fileInputRef = useRef(null);
  const closeBtnRef = useRef(null);

  const bulkCreateBooks = useMutation({
    mutationFn: async (books) => {
      const res = await api.post("/books/bulk", { books });
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["books"] });
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
      const msg = err?.response?.data?.message || "API Error: could not complete bulk import.";
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
    if (!bulkCreateBooks.isPending && fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }, [bulkCreateBooks.isPending]);

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

  const parseFileToBooks = useCallback((data, extension) => {
    const workbook = XLSX.read(data, {
      type: ["xlsx", "xls"].includes(extension) ? "array" : "string",
      raw: true,
    });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const options = { defval: null };
    if (extension === "tsv") options.FS = "\t";

    const rows = XLSX.utils.sheet_to_json(worksheet, options);

    const books = rows
      .map((raw) => {
        const obj = {};
        for (const k in raw) {
          const nk = normalizeKey(k);
          if (ALLOWED_HEADERS.includes(nk)) {
            // restore expected backend casing
            if (nk === "booktype") obj.BookType = raw[k];
            else if (nk === "totalpages") obj.totalPages = raw[k];
            else if (nk === "totalcopies") obj.totalCopies = raw[k];
            else if (nk === "availablecopies") obj.availableCopies = raw[k];
            else obj[nk] = raw[k];
          }
        }

        const title = String(obj.title || "").trim();
        if (!title) return null; // backend requires title

        // isbn is optional, keep if provided
        if (obj.isbn != null) obj.isbn = String(obj.isbn).trim();

        if (obj.status != null) obj.status = String(obj.status).trim().toLowerCase();

        return {
          title,
          author: obj.author ? String(obj.author).trim() : "",
          isbn: obj.isbn || "", // optional
          BookType: obj.BookType ? String(obj.BookType).trim() : "",
          status: obj.status || "available",
          totalPages: obj.totalPages ?? 0,
          totalCopies: obj.totalCopies ?? 1,
          availableCopies: obj.availableCopies ?? "",
          book_picture: obj.book_picture ? String(obj.book_picture).trim() : "",
        };
      })
      .filter(Boolean);

    return books;
  }, []);

  const handleUpload = useCallback(() => {
    if (!file || bulkCreateBooks.isPending) return;

    setStatusMessage("Processing file...");
    setStatusType("info");

    const extension = file.name.split(".").pop().toLowerCase();
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = event.target.result;
        const books = parseFileToBooks(data, extension);

        if (!books.length) {
          const msg = "No valid book data found in the file (title required).";
          setStatusMessage(msg);
          setStatusType("error");
          toast.error(msg);
          return;
        }

        const msg = `Found ${books.length} records. Uploading...`;
        setStatusMessage(msg);
        setStatusType("info");
        toast(msg);

        bulkCreateBooks.mutate(books);
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
  }, [file, bulkCreateBooks, parseFileToBooks]);

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
          <h2 className="text-xl font-bold">Bulk Books Import</h2>

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

        <div className="flex justify-end mb-3">
          <Button type="button" variant="outline" onClick={buildTemplateAndDownload} disabled={bulkCreateBooks.isPending}>
            <Download className="h-4 w-4 mr-2" />
            Download template
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
          <p className="text-lg font-semibold text-center">{file ? file.name : "Click or drag & drop file to import"}</p>
          <p className="text-sm text-muted-foreground text-center">Supported formats: .xlsx, .xls, .csv, .tsv</p>

          <input
            ref={fileInputRef}
            type="file"
            accept={IMPORT_ACCEPT}
            onChange={handleFileChange}
            className="hidden"
            disabled={bulkCreateBooks.isPending}
            tabIndex={-1}
            aria-label="Select file to import"
          />
        </div>

        <div className={`mt-4 p-3 rounded-xl flex items-center gap-3 ${statusTone[statusType]}`} aria-live="assertive">
          <StatusIcon size={20} aria-hidden="true" />
          <p className="text-sm font-medium">
            {statusMessage.length ? statusMessage : "Required column: title (isbn is optional; generated automatically)."}
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={handleCancel} disabled={bulkCreateBooks.isPending} type="button">
            Cancel
          </Button>

          <Button
            onClick={handleUpload}
            disabled={!file || bulkCreateBooks.isPending || statusType === "success"}
            type="button"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <UploadCloud className="h-4 w-4 mr-2" />
            {bulkCreateBooks.isPending ? "Uploading..." : "Start Import"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default ImportBooksExcelModal;