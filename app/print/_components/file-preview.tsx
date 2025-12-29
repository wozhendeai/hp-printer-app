"use client";

import { useState, useEffect } from "react";
import { X, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/ui/item";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  uploadProgress?: number;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(file: File): "pdf" | "image" {
  return file.type === "application/pdf" ? "pdf" : "image";
}

function getFileExtension(file: File): string {
  return file.name.split(".").pop()?.toUpperCase() || "FILE";
}

export function FilePreview({
  file,
  onRemove,
  uploadProgress,
  disabled,
}: FilePreviewProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileType = getFileType(file);
  const isUploading = uploadProgress !== undefined && uploadProgress < 100;

  useEffect(() => {
    if (fileType === "image") {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      return () => reader.abort();
    }
  }, [file, fileType]);

  return (
    <Item variant="outline" className="rounded-xl">
      <ItemMedia variant="image" className="size-14 rounded-lg">
        {fileType === "image" && imagePreview ? (
          <img src={imagePreview} alt={file.name} />
        ) : (
          <div className="size-full bg-muted flex items-center justify-center">
            <FileIcon type={fileType} />
          </div>
        )}
      </ItemMedia>

      <ItemContent>
        <ItemTitle>{file.name}</ItemTitle>
        {isUploading ? (
          <div className="mt-1">
            <Progress value={uploadProgress} className="h-1" />
            <ItemDescription className="mt-1">
              Uploading... {uploadProgress}%
            </ItemDescription>
          </div>
        ) : (
          <ItemDescription>
            {getFileExtension(file)} · {formatFileSize(file.size)}
          </ItemDescription>
        )}
      </ItemContent>

      <ItemActions>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          disabled={disabled}
          className="rounded-full"
        >
          <X className="size-4" />
          <span className="sr-only">Remove file</span>
        </Button>
      </ItemActions>
    </Item>
  );
}

function FileIcon({ type }: { type: "pdf" | "image" }) {
  const Icon = type === "pdf" ? FileText : ImageIcon;
  return <Icon className="size-6 text-muted-foreground" />;
}
