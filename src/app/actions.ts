"use server";

import { getNamespace } from "@/lib/agentset";
import { nanoid } from "nanoid";
import { z } from "zod";

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

export async function createUploadPresignedUrl(
  body: CreateUploadPresignedUrlBody
) {
  const { fileName, contentType, fileSize } =
    createUploadPresignedUrlBodySchema.parse(body);

  const ns = getNamespace();

  const uploadResult = await ns.uploads.create({
    fileName,
    contentType,
    fileSize,
  });

  return uploadResult;
}

export async function createIngestion(key: string, fileName: string) {
  const chatId = nanoid();
  const ns = getNamespace();

  const job = await ns.ingestion.create({
    name: fileName,
    externalId: chatId,
    payload: {
      type: "MANAGED_FILE",
      key,
      fileName,
    },
    config: {
      metadata: { chatId },
    },
  });

  return job;
}

export async function getIngestionJob(jobId: string) {
  const ns = getNamespace();
  const job = await ns.ingestion.get(jobId);
  return job;
}

const createUploadPresignedUrlBodySchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  contentType: z
    .string()
    .refine(s => s === "application/pdf", "Only PDF files are allowed"),
  fileSize: z
    .number()
    .min(1, "File size is required")
    .max(MAX_FILE_SIZE, "File size must be less than 200MB"),
});
type CreateUploadPresignedUrlBody = z.infer<
  typeof createUploadPresignedUrlBodySchema
>;
