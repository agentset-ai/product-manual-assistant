import { openai } from "@ai-sdk/openai";

// Configure the LLM model for RAG steps
export const llmModel = openai("gpt-4o-mini");

