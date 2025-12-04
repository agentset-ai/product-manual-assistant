"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileTextIcon, Loader2Icon, UploadCloudIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { createIngestion } from "./actions";

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

type UploadStatus = "idle" | "uploading" | "processing" | "error";

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    setError(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file type
    if (selectedFile.type !== "application/pdf") {
      setError("Please select a PDF file");
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size must be less than 200MB");
      return;
    }

    setFile(selectedFile);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0] ?? null;
      handleFileSelect(selectedFile);
    },
    [handleFileSelect]
  );

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setStatus("uploading");
    setError(null);

    try {
      // Step 1: Get presigned URL
      const presignedResponse = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json();
        throw new Error(errorData.error || "Failed to get upload URL");
      }

      const { url, key } = await presignedResponse.json();

      // Step 2: Upload file to presigned URL
      const uploadResponse = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      setStatus("processing");

      // Step 3: Create ingestion job
      const job = await createIngestion(key, file.name);

      // Step 4: Redirect to chat page
      router.push(`/chat/${job.id}`);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }, [file, router]);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setError(null);
    setStatus("idle");
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Product Manual Assistant
          </h1>
          <p className="text-muted-foreground">
            Upload a product manual PDF to chat with an AI assistant about its
            contents
          </p>
        </div>

        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            className={cn(
              "relative rounded-lg border-2 border-dashed transition-colors",
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
              status !== "idle" && "pointer-events-none opacity-60"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="application/pdf"
              onChange={handleInputChange}
              className="absolute inset-0 cursor-pointer opacity-0"
              disabled={status !== "idle"}
            />
            <div className="flex flex-col items-center justify-center gap-4 p-12">
              <div className="rounded-full bg-muted p-4">
                <UploadCloudIcon className="size-8 text-muted-foreground" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-medium text-foreground">
                  Drop your PDF here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Maximum file size: 200MB
                </p>
              </div>
            </div>
          </div>

          {/* Selected File */}
          {file && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileTextIcon className="size-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {file.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              {status === "idle" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  className="shrink-0"
                >
                  <XIcon className="size-4" />
                </Button>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!file || status !== "idle"}
            className="w-full"
            size="lg"
          >
            {status === "uploading" && (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Uploading...
              </>
            )}
            {status === "processing" && (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Creating ingestion job...
              </>
            )}
            {status === "idle" && "Upload and Start Chat"}
            {status === "error" && "Try Again"}
          </Button>
        </div>
      </div>
    </div>
  );
}
