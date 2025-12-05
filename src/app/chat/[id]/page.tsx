import type { Metadata } from "next";
import { ChatPageClient } from "./_components/chat-page-client";

export const metadata: Metadata = {
  title: "Chat with Product Manual",
  description: "Chat with your product manual using AI. Powered by Agentset.",
};

export default async function ChatPage({ params }: PageProps<"/chat/[id]">) {
  const { id: jobId } = await params;

  return <ChatPageClient jobId={jobId} />;
}
