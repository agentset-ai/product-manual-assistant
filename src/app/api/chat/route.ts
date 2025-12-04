import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, UIMessage } from "ai";

const SYSTEM_PROMPT = `You are a helpful, friendly, and knowledgeable assistant. You provide clear, accurate, and concise answers to user questions.

Guidelines:
- Be conversational and approachable
- Provide helpful and accurate information
- If you're unsure about something, acknowledge it
- Format responses with markdown when appropriate (lists, code blocks, etc.)
- Keep responses focused and relevant to the user's question`;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
