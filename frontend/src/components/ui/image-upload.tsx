"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { ImageIcon, X, Upload } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  value: File | string | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  aspectRatio?: string;
  className?: string;
  label?: string;
  hint?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  accept = "image/*",
  maxSize = 5,
  aspectRatio = "aspect-square",
  className,
  label = "Upload Image",
  hint,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // Handle File object URL creation and cleanup
  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
       
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setObjectUrl(null);
    }
  }, [value]);

  const getPreviewUrl = (): string | null => {
    if (!value) return null;
    if (typeof value === "string") return value;
    return objectUrl;
  };

  const previewUrl = getPreviewUrl();
  const isExternalUrl = typeof value === "string" && value.startsWith("http");

  const handleFileChange = (file: File | null) => {
    setError(null);

    if (!file) {
      onChange(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    onChange(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    onChange(null);
    if (onRemove) onRemove();
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {previewUrl ? (
        <div className={cn("relative border rounded-lg overflow-hidden", aspectRatio)}>
          {isExternalUrl ? (
            // Use regular img for external URLs to avoid Next.js Image optimization issues
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized
            />
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            aspectRatio,
            "flex flex-col items-center justify-center",
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          )}
        >
          <div className="flex flex-col items-center gap-2">
            {isDragging ? (
              <Upload className="h-10 w-10 text-blue-500" />
            ) : (
              <ImageIcon className="h-10 w-10 text-gray-400" />
            )}
            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600">{label}</span>
              <p className="text-xs text-gray-500 mt-1">
                or drag and drop
              </p>
            </div>
            {hint && <p className="text-xs text-gray-400">{hint}</p>}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
