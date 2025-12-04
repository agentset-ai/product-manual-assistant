"use server";

import { getNamespace } from "@/lib/agentset";

export async function createIngestion(key: string, fileName: string) {
  const ns = getNamespace();

  const job = await ns.ingestion.create({
    name: fileName,
    payload: {
      type: "MANAGED_FILE",
      key,
      fileName,
    },
  });

  return job;
}

export async function getIngestionJob(jobId: string) {
  const ns = getNamespace();
  const job = await ns.ingestion.get(jobId);
  return job;
}

