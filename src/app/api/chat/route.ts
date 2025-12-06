import { AgenticEngine } from "@agentset/ai-sdk";
import { getNamespace } from "@/lib/agentset";
import { llmModel } from "@/lib/llm";
import { z } from "zod";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  validateUIMessages,
} from "ai";

const SYSTEM_PROMPT = `You are a helpful product manual assistant. You help users understand their product by answering questions based on the product manual documentation.

Guidelines:
- Answer questions based on the retrieved context from the product manual
- Be clear, accurate, and helpful
- If the information isn't found in the manual, acknowledge that clearly
- Format responses with markdown when appropriate (lists, code blocks, etc.)
- Keep responses focused and relevant to the user's question about the product`;

const chatBodySchema = z.object({
  messages: z.array(z.any()),
  chatId: z.string().min(1, "Chat ID is required"),
});

export async function POST(req: Request) {
  const { messages, chatId } = chatBodySchema.parse(await req.json());
  const validatedMessages = await validateUIMessages({ messages });

  const modelMessages = convertToModelMessages(validatedMessages);

  const ns = getNamespace();

  // Use AgenticEngine for RAG-powered responses
  // Filter search to only include documents from this specific chat/ingestion
  const stream = AgenticEngine(ns, {
    messages: modelMessages,
    maxEvals: 1,
    generateQueriesStep: {
      model: llmModel,
    },
    evaluateQueriesStep: {
      model: llmModel,
    },
    answerStep: {
      model: llmModel,
      system: SYSTEM_PROMPT,
    },
    queryOptions: {
      rerankLimit: 5,
      minScore: 0.5,
      filter: { chatId },
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
}
