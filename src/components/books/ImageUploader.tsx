"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File) => {
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();

      // ✅ REAL, persistent URL
      onChange(data.url);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.[0]) {
      uploadFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`relative w-40 h-60 border rounded overflow-hidden flex items-center justify-center cursor-pointer
          ${isDragActive ? "border-accentHover bg-accent" : "border-border bg-white"}`}
      >
        <input {...getInputProps()} disabled={uploading} />

        {value ? (
          <>
            <img
              src={value}
              className="w-full h-full object-cover"
              alt="Book cover"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded"
            >
              Remove
            </button>
          </>
        ) : (
          <span className="text-textSecondary text-sm">
            {uploading ? "Uploading image…" : "Click or drag image here"}
          </span>
        )}
      </div>
    </div>
  );
}
