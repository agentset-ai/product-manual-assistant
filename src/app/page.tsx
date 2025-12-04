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
import { useChat } from "@ai-sdk/react";
import { MessageSquareIcon } from "lucide-react";
import { useState } from "react";

export default function Home() {
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
        <h1 className="text-xl font-semibold text-foreground">AI Chat</h1>
      </header>

      <Conversation className="flex-1">
        <ConversationContent className="mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Start a conversation"
              description="Send a message to begin chatting with the AI assistant"
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
              placeholder="Type your message..."
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
