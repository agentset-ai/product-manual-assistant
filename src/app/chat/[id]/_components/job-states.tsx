"use client";

import { Button } from "@/components/ui/button";
import type { IngestJobSchema } from "agentset";
import {
  AlertCircleIcon,
  FileTextIcon,
  Loader2Icon,
  RefreshCwIcon,
} from "lucide-react";
import Link from "next/link";

type JobStatus = IngestJobSchema["status"];

export function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export function ProcessingState({
  status,
  fileName,
}: {
  status: JobStatus;
  fileName: string;
}) {
  const statusMessages: Record<string, string> = {
    BACKLOG: "Waiting in queue...",
    QUEUED: "Queued for processing...",
    QUEUED_FOR_RESYNC: "Queued for resync...",
    PRE_PROCESSING: "Pre-processing document...",
    PROCESSING: "Processing document...",
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 text-center max-w-md px-4">
        <div className="relative">
          <div className="rounded-full bg-primary/10 p-6">
            <FileTextIcon className="size-12 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-1">
            <Loader2Icon className="size-6 animate-spin text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Processing Your Document
          </h2>
          <p className="text-muted-foreground">{fileName}</p>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {statusMessages[status] || "Processing..."}
          </p>
          <p className="text-xs text-muted-foreground">
            This may take a few minutes depending on the document size
          </p>
        </div>
      </div>
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 text-center max-w-md px-4">
        <div className="rounded-full bg-destructive/10 p-6">
          <AlertCircleIcon className="size-12 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Something went wrong
          </h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/">Go Back</Link>
          </Button>
          <Button onClick={onRetry}>
            <RefreshCwIcon className="mr-2 size-4" />
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FailedState({
  error,
  fileName,
}: {
  error: string;
  fileName: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 text-center max-w-md px-4">
        <div className="rounded-full bg-destructive/10 p-6">
          <AlertCircleIcon className="size-12 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Processing Failed
          </h2>
          <p className="text-muted-foreground">{fileName}</p>
          <p className="text-sm text-destructive">{error}</p>
        </div>
        <Button asChild>
          <Link href="/">Upload Another Document</Link>
        </Button>
      </div>
    </div>
  );
}

export function CancelledState({ fileName }: { fileName: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 text-center max-w-md px-4">
        <div className="rounded-full bg-muted p-6">
          <AlertCircleIcon className="size-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Processing Cancelled
          </h2>
          <p className="text-muted-foreground">{fileName}</p>
        </div>
        <Button asChild>
          <Link href="/">Upload Another Document</Link>
        </Button>
      </div>
    </div>
  );
}
