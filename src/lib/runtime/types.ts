export interface AgentManifest {
  version: string;
  site: { name: string; origin: string; description: string };
  networks: NetworkEntry[];
  llm: { default_provider: string; byok: boolean; providers: string[] };
  policy?: { peer_origins?: string[] };
}

export interface NetworkEntry {
  name: string;
  front_man: string;
  hocon: string;
  description: string;
}

export interface NetworkDefinition {
  name: string;
  front_man: string;
  agents: Record<string, AgentDefinition>;
}

export interface AgentDefinition {
  instructions: string;
  steps: string[];
  capabilities: Capability[];
}

export interface Capability {
  name: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
}

export interface LLMConfig {
  provider: "gemini" | "groq";
  apiKey: string;
  model: string;
}

export interface AgentResult {
  summary: string;
  claims: string[];
  guardrails: GuardrailResult;
}

export interface GuardrailResult {
  passed: boolean;
  checks: { name: string; passed: boolean; detail?: string }[];
}

export interface ExecutionTrace {
  step: string;
  status: "ok" | "error";
  detail?: string;
}