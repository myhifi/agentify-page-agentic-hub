export interface AgentManifest {
  version: string;
  site: { name: string; origin: string; description: string };
  llm_router?: { default_provider: string; byok: boolean; providers: string[] };
  peer_policy?: { allow_peers?: boolean; allowed_peers?: string[]; peer_origins?: string[] };
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
  tools?: {
    name: string;
    description: string;
    instructions: string;
    input_schema: Record<string, unknown>;
    output_schema: Record<string, unknown>;
  }[];
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
  provider: "gemini" | "groq" | "otari";
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