"use client";

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
import { cn } from "@/lib/utils";
import type { AgentsetUIMessage } from "@agentset/ai-sdk";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { FileTextIcon, MessageSquareIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Status display labels for RAG workflow
const STATUS_LABELS: Record<string, string> = {
  "generating-queries": "Generating search queries...",
  "evaluating-queries": "Searching document...",
  searching: "Searching document...",
  answering: "Generating answer...",
};

function RAGStatusIndicator({ status }: { status: string }) {
  const label = STATUS_LABELS[status] || "Processing...";

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground",
        "animate-pulse"
      )}
    >
      <SearchIcon className="size-4" />
      <span>{label}</span>
    </div>
  );
}

// Get current RAG status from the last assistant message
function getCurrentStatus(message: AgentsetUIMessage): string | null {
  if (message.role !== "assistant") return null;

  for (const part of message.parts) {
    if (part.type === "data-status") {
      return part.data as string;
    }
  }
  return null;
}

// Get text content from message parts
function getTextContent(message: AgentsetUIMessage): string {
  return message.parts
    .filter(part => part.type === "text")
    .map(part => (part.type === "text" ? part.text : ""))
    .join("");
}

// Check if message has any text content
function hasTextContent(message: AgentsetUIMessage): boolean {
  return message.parts.some(
    part => part.type === "text" && part.text.trim().length > 0
  );
}

export function ChatInterface({
  fileName,
  chatId,
}: {
  fileName: string;
  chatId: string | null;
}) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat<AgentsetUIMessage>({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { chatId },
    }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
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
          <Button variant="outline" asChild className="whitespace-nowrap">
            <Link href="/">New Chat</Link>
          </Button>
        </div>
      </header>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Ask about your document"
              description="Start a conversation to learn about the contents of your product manual"
              icon={<MessageSquareIcon className="size-8" />}
            />
          ) : (
            messages.map(message => {
              const ragStatus = getCurrentStatus(message);
              const textContent = getTextContent(message);
              const hasText = hasTextContent(message);

              return (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {message.role === "user" ? (
                      message.parts.map((part, index) =>
                        part.type === "text" ? (
                          <span key={index}>{part.text}</span>
                        ) : null
                      )
                    ) : (
                      <div className="space-y-3">
                        {/* Show RAG status indicator */}
                        {ragStatus && !hasText && (
                          <RAGStatusIndicator status={ragStatus} />
                        )}

                        {/* Show the response text */}
                        {hasText && (
                          <MessageResponse>{textContent}</MessageResponse>
                        )}
                      </div>
                    )}
                  </MessageContent>
                </Message>
              );
            })
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <footer className="shrink-0 border-t border-border bg-background p-4">
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
