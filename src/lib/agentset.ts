import { Agentset } from "agentset";

if (!process.env.AGENTSET_API_KEY) {
  throw new Error("AGENTSET_API_KEY environment variable is required");
}

const agentset = new Agentset({
  apiKey: process.env.AGENTSET_API_KEY,
});

// Get namespace instance
// Requires AGENTSET_NAMESPACE environment variable
export function getNamespace() {
  const namespaceId = process.env.AGENTSET_NAMESPACE;
  if (!namespaceId) {
    throw new Error("AGENTSET_NAMESPACE environment variable is required");
  }
  return agentset.namespace(namespaceId);
}

export { agentset };
