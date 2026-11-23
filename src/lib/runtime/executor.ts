import type { AgentDefinition, NetworkDefinition, LLMConfig, AgentResult } from "./types";
import type { ExecutionTrace } from "./types";
import { callLLM } from "./llm";
import { evaluateOutput } from "./guardrails";

export async function executeAgent(
  network: NetworkDefinition,
  input: { text: string },
  llmConfig: LLMConfig
): Promise<{ result: AgentResult; trace: ExecutionTrace[] }> {
  const agent: AgentDefinition = network.agents[network.front_man];
  if (!agent) throw new Error(`Front agent "${network.front_man}" not found`);

  const trace: ExecutionTrace[] = [];

  // Step 1 — Prepare
  const preparedText = input.text.slice(0, 8000); // keep prompt manageable
  trace.push({ step: "prepare", status: "ok", detail: `Prepared ${preparedText.length} chars` });

  // Step 2 — Reason
  let raw: unknown;
  try {
    raw = await callLLM(
      llmConfig,
      agent.instructions,
      `Source text:\n\n${preparedText}\n\nReturn JSON with "summary" and "claims" array.`
    );
    trace.push({ step: "reason", status: "ok" });
  } catch (e) {
    trace.push({ step: "reason", status: "error", detail: (e as Error).message });
    throw e;
  }

  // Step 3 — Evaluate
  const { parsed, guardrails } = evaluateOutput(raw, preparedText);
  trace.push({
    step: "evaluate",
    status: guardrails.passed ? "ok" : "error",
    detail: guardrails.passed ? "All guardrails passed" : guardrails.checks.filter(c => !c.passed).map(c => c.name).join(", "),
  });

  return {
    result: { summary: parsed.summary, claims: parsed.claims, guardrails },
    trace,
  };
}