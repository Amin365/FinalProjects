import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BookModal({ isOpen, onClose, onSuccess, initialData = null, mode: inputMode = null }) {
  const qc = useQueryClient();
  const mode = inputMode || (initialData ? "edit" : "create");

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: "",
      author: "",
      isbn: "",
      BookType: "",
      status: "available",
      totalPages: "",
      availableCopies: "",
    },
  });

  // Reset form when initialData or open changes
  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title ?? "",
        author: initialData.author ?? "",
        isbn: initialData.isbn ?? "",
        BookType: initialData.BookType ?? "",
        status: initialData.status ?? "available",
        totalPages: initialData.totalPages ?? "",
        availableCopies: initialData.availableCopies ?? "",
      });
    } else {
      reset({
        title: "",
        author: "",
        isbn: "",
        BookType: "",
        status: "available",
        totalPages: "",
        availableCopies: "",
      });
    }
  }, [initialData, isOpen, reset]);

  // Create / Update mutations support FormData
  const createMutation = useMutation({
    mutationFn: async (formData) => {
      // formData expected to be a FormData instance
      const res = await api.post("/books", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data?.data ?? res.data;
    },
    onSuccess: (data) => {
      toast.success("Book created");
      qc.invalidateQueries({ queryKey: ["books"] });
      onSuccess && onSuccess(data);
      onClose && onClose();
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to create book";
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }) => {
      // formData may be FormData or a plain object — we will always send FormData here
      const res = await api.put(`/books/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data?.data ?? res.data;
    },
    onSuccess: (data) => {
      toast.success("Book updated");
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["book", data._id ?? data.id] });
      onSuccess && onSuccess(data);
      onClose && onClose();
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to update book";
      toast.error(msg);
    },
  });

  const onSubmit = (values) => {
    // values may contain `image` from the file input registered below
    const file = values.image?.[0];

    // Build FormData and append only filled values
    const formData = new FormData();

    // append primitives
    if (values.title) formData.append("title", values.title);
    if (values.author) formData.append("author", values.author);
    if (values.isbn) formData.append("isbn", values.isbn);
    if (values.BookType) formData.append("BookType", values.BookType);
    if (values.status) formData.append("status", values.status);
    if (values.totalPages !== undefined && values.totalPages !== "")
      formData.append("totalPages", values.totalPages);
    if (values.availableCopies !== undefined && values.availableCopies !== "")
      formData.append("availableCopies", values.availableCopies);

    // file field must match server's upload.single('image')
    if (file) {
      formData.append("image", file, file.name);
    } else if (initialData?.book_picture && mode === "edit") {
      // If editing and the existing book has a picture you want to keep,
      // nothing to append; server should keep existing image if no new file arrives.
      // Optionally you could append book_picture as a URL if you want explicit override:
      // formData.append('book_picture', initialData.book_picture);
    }

    if (mode === "edit" && initialData && initialData._id) {
      updateMutation.mutate({ id: initialData._id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const loading = createMutation.isLoading || updateMutation.isLoading;

  // optional preview - watch file input
  const watchedFile = watch("image");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose && onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Book" : "Register New Book"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="mb-3">
            <Label htmlFor="title" className="block mb-1">Title</Label>
            <Input id="title" {...register("title", { required: "Title is required" })} />
            {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
          </div>

          <div className="mb-3">
            <Label htmlFor="author" className="block mb-1">Author</Label>
            <Input id="author" {...register("author")} />
          </div>

          <div className="mb-3">
            <Label htmlFor="totalPages" className="block mb-1">Total Pages</Label>
            <Input id="totalPages" {...register("totalPages")} />
          </div>

          <div className="mb-3">
            <Label htmlFor="BookType" className="block mb-1">Book Type</Label>
            <Input id="BookType" {...register("BookType")} placeholder="e.g. Fiction, Non-fiction" />
          </div>

          <div className="mb-3">
            <Label htmlFor="availableCopies" className="block mb-1">Available Copies</Label>
            <Input id="availableCopies" {...register("availableCopies")} />
          </div>

          <div className="mb-3">
            <Label htmlFor="status" className="block mb-1">Status</Label>
            <select {...register("status")} className="w-full p-2 border rounded">
              <option value="available">available</option>
              <option value="borrowed">borrowed</option>
            </select>
          </div>

          <div className="mb-3">
            <Label htmlFor="image" className="block mb-1">Book Picture</Label>
            <Input id="image" type="file" accept="image/*" {...register("image")} />
            {watchedFile && watchedFile.length > 0 && (
              <img
                src={URL.createObjectURL(watchedFile[0])}
                alt="preview"
                className="w-32 h-20 object-cover mt-2 rounded"
              />
            )}
            {/* if you want to allow direct URL input instead of file, you could add an input for book_picture */}
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => { reset(); onClose && onClose(); }}>Cancel</Button>
            <Button type="submit" disabled={loading || isSubmitting}>
              {loading ? (mode === "edit" ? "Updating..." : "Registering...") : (mode === "edit" ? "Update Book" : "Register Book")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}