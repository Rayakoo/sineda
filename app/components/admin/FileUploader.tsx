"use client";

import { useState, useRef } from "react";
import { uploadToGarage } from "@/services/garage";

interface FileUploaderProps {
  onUploadComplete: (url: string) => void;
  accept?: string;
  label?: string;
}

export default function FileUploader({ onUploadComplete, accept = "image/*", label = "Upload" }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToGarage(file);
      if (url) onUploadComplete(url);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="shrink-0 px-3 py-2.5 rounded-xl text-xs font-semibold bg-[#005696] text-white hover:bg-[#003d6e] transition-colors disabled:opacity-50 flex items-center gap-1.5"
      >
        {uploading ? (
          <i className="fas fa-spinner fa-spin text-xs"></i>
        ) : (
          <i className="fas fa-upload text-xs"></i>
        )}
        {uploading ? "Uploading..." : label}
      </button>
    </>
  );
}
