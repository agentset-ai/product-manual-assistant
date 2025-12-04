"use client";

import { getIngestionJob } from "@/app/actions";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import type { IngestJobSchema } from "agentset";
import {
  AlertCircleIcon,
  FileTextIcon,
  Loader2Icon,
  MessageSquareIcon,
  RefreshCwIcon,
} from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";

type JobStatus = IngestJobSchema["status"];

const PROCESSING_STATUSES: JobStatus[] = [
  "BACKLOG",
  "QUEUED",
  "QUEUED_FOR_RESYNC",
  "PRE_PROCESSING",
  "PROCESSING",
];

const POLLING_INTERVAL = 3000; // 3 seconds

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function ChatPage({ params }: PageProps) {
  const { id: jobId } = use(params);
  const [job, setJob] = useState<IngestJobSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobStatus = useCallback(async () => {
    try {
      const jobData = await getIngestionJob(jobId);
      setJob(jobData);
      setError(null);
      return jobData;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch job status"
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJobStatus();
  }, [fetchJobStatus]);

  // Poll for status updates while processing
  useEffect(() => {
    if (!job || !PROCESSING_STATUSES.includes(job.status)) {
      return;
    }

    const intervalId = setInterval(async () => {
      const updatedJob = await fetchJobStatus();
      if (updatedJob && !PROCESSING_STATUSES.includes(updatedJob.status)) {
        clearInterval(intervalId);
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [job, fetchJobStatus]);

  // Get file name from job payload
  const fileName =
    job?.payload && "fileName" in job.payload
      ? (job.payload.fileName as string)
      : "Document";

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchJobStatus} />;
  }

  if (!job) {
    return <ErrorState error="Job not found" onRetry={fetchJobStatus} />;
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
    return <ChatInterface fileName={fileName} />;
  }

  // Fallback for unexpected statuses
  return (
    <ErrorState
      error={`Unexpected status: ${job.status}`}
      onRetry={fetchJobStatus}
    />
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function ProcessingState({
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

function ErrorState({
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

function FailedState({ error, fileName }: { error: string; fileName: string }) {
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

function CancelledState({ fileName }: { fileName: string }) {
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

function ChatInterface({ fileName }: { fileName: string }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileTextIcon className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">
              {fileName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Product Manual Assistant
            </p>
          </div>
        </div>
      </header>

      <Conversation className="flex-1">
        <ConversationContent className="mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Ask about your document"
              description="Start a conversation to learn about the contents of your product manual"
              icon={<MessageSquareIcon className="size-8" />}
            />
          ) : (
            messages.map(message => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.role === "user" ? (
                    message.parts.map((part, index) =>
                      part.type === "text" ? (
                        <span key={index}>{part.text}</span>
                      ) : null
                    )
                  ) : (
                    <MessageResponse>
                      {message.parts
                        .filter(part => part.type === "text")
                        .map(part => (part.type === "text" ? part.text : ""))
                        .join("")}
                    </MessageResponse>
                  )}
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <footer className="border-t border-border bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <PromptInput
            onSubmit={(msg, e) => {
              handleSubmit(e);
            }}
          >
            <PromptInputTextarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a question about your document..."
            />
            <PromptInputFooter>
              <div />
              <PromptInputSubmit
                status={status}
                disabled={!input.trim() || status === "streaming"}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </footer>
    </div>
  );
}
