"use client";

import { getIngestionJob } from "@/app/actions";
import { useQuery } from "@tanstack/react-query";
import type { IngestJobSchema } from "agentset";
import { ChatInterface } from "./chat-interface";
import {
  CancelledState,
  ErrorState,
  FailedState,
  LoadingState,
  ProcessingState,
} from "./job-states";

type JobStatus = IngestJobSchema["status"];

const PROCESSING_STATUSES: JobStatus[] = [
  "BACKLOG",
  "QUEUED",
  "QUEUED_FOR_RESYNC",
  "PRE_PROCESSING",
  "PROCESSING",
];

const POLLING_INTERVAL = 3000; // 3 seconds

type ChatPageClientProps = {
  jobId: string;
};

export function ChatPageClient({ jobId }: ChatPageClientProps) {
  const jobIdWithPrefix = `job_${jobId}`;

  const {
    data: job,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["ingestionJob", jobIdWithPrefix],
    queryFn: () => getIngestionJob(jobIdWithPrefix),
    refetchInterval: query => {
      // Only poll while the job is in a processing state
      const currentJob = query.state.data;
      if (currentJob && PROCESSING_STATUSES.includes(currentJob.status)) {
        return POLLING_INTERVAL;
      }
      // Stop polling when job is complete, failed, or cancelled
      return false;
    },
  });

  // Get file name from job payload
  const fileName =
    job?.payload && "fileName" in job.payload
      ? (job.payload.fileName as string)
      : "Document";

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        error={
          error instanceof Error ? error.message : "Failed to fetch job status"
        }
        onRetry={() => refetch()}
      />
    );
  }

  if (!job) {
    return <ErrorState error="Job not found" onRetry={() => refetch()} />;
  }

  if (PROCESSING_STATUSES.includes(job.status)) {
    return <ProcessingState status={job.status} fileName={fileName} />;
  }

  if (job.status === "FAILED") {
    return (
      <FailedState
        error={job.error || "Ingestion failed"}
        fileName={fileName}
      />
    );
  }

  if (job.status === "CANCELLED") {
    return <CancelledState fileName={fileName} />;
  }

  if (job.status === "COMPLETED") {
    // Use externalId (chatId) for filtering searches to this specific document
    return <ChatInterface fileName={fileName} chatId={job.externalId} />;
  }

  // Fallback for unexpected statuses
  return (
    <ErrorState
      error={`Unexpected status: ${job.status}`}
      onRetry={() => refetch()}
    />
  );
}
