"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

const ACCEPTED_EXTENSIONS = Object.values(ACCEPTED_TYPES).flat();

function isValidFile(file: File): boolean {
  const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
  return ACCEPTED_EXTENSIONS.includes(extension);
}

export function UploadZone({ onFileSelect, disabled }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file && isValidFile(file)) {
        onFileSelect(file);
      }
    },
    [disabled, onFileSelect],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && isValidFile(file)) {
        onFileSelect(file);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [onFileSelect],
  );

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
        isDragOver && !disabled
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <input
        type="file"
        accept={Object.keys(ACCEPTED_TYPES).join(",")}
        onChange={handleFileInput}
        disabled={disabled}
        className="sr-only"
      />

      <div
        className={cn(
          "flex size-14 items-center justify-center rounded-full transition-colors",
          isDragOver && !disabled ? "bg-primary/10" : "bg-muted",
        )}
      >
        <Upload
          className={cn(
            "size-6",
            isDragOver && !disabled ? "text-primary" : "text-muted-foreground",
          )}
        />
      </div>

      <div className="text-center">
        <p className="font-medium">Upload a file to print</p>
        <p className="text-sm text-muted-foreground mt-1">
          Drag & drop or tap to browse
        </p>
      </div>

      <div className="flex items-center gap-2">
        <FormatBadge icon={FileText} label="PDF" />
        <FormatBadge icon={Image} label="JPEG" />
        <FormatBadge icon={Image} label="PNG" />
      </div>
    </label>
  );
}

function FormatBadge({
  icon: Icon,
  label,
}: {
  icon: typeof FileText;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground bg-muted rounded-md">
      <Icon className="size-3" />
      {label}
    </span>
  );
}
