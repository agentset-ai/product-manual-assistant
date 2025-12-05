import { getNamespace } from "@/lib/agentset";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const jobId = searchParams.get("jobId");
  if (!jobId) {
    return new Response("Job ID is required", { status: 400 });
  }

  const ns = getNamespace();
  const job = await ns.ingestion.get(jobId);

  return Response.json(job);
}
