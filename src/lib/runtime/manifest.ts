import type { AgentManifest, NetworkDefinition, NetworkEntry } from "./types";

export async function loadManifest(baseUrl = ""): Promise<AgentManifest> {
  const res = await fetch(`${baseUrl}/.well-known/agent-manifest.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
  return res.json();
}

export async function loadNetwork(manifest: AgentManifest, networkName: string): Promise<NetworkDefinition> {
  const entry: NetworkEntry | undefined = manifest.networks.find(n => n.name === networkName);
  if (!entry) throw new Error(`Network "${networkName}" not found in manifest`);
  const res = await fetch(entry.hocon, { cache: "no-store" });
  if (!res.ok) throw new Error(`Network fetch failed: ${res.status}`);
  return res.json();
}