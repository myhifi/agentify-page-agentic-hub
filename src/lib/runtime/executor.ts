import type { AgentDefinition, NetworkDefinition, LLMConfig, AgentResult, ExecutionTrace } from "./types";
import { callLLM } from "./llm";
import { evaluateOutput, evaluateInput } from "./guardrails";

export async function executeAgent(
  network: NetworkDefinition,
  input: { text: string },
  llmConfig: LLMConfig
): Promise<{ result: AgentResult; trace: ExecutionTrace[] }> {
  const agent: AgentDefinition = network.agents[network.front_man];
  if (!agent) throw new Error(`Front agent "${network.front_man}" not found`);

  const trace: ExecutionTrace[] = [];
  const capability = agent.capabilities[0];

  // DYNAMIC STEP 1: Validate Input against Network Schema
  const inputSchema = capability.input_schema as { properties?: { text?: { minLength?: number } } };
  const minLength = inputSchema?.properties?.text?.minLength || 1;
  if (input.text.length < minLength) {
    throw new Error(`Input text is too short. Minimum length is ${minLength} characters.`);
  }

  // PRE-FLIGHT GUARDRAIL: Block prompt injection before calling LLM
  const inputCheck = evaluateInput(input.text);
  if (!inputCheck.passed) {
    trace.push({ step: "evaluate", status: "error", detail: inputCheck.detail });
    return {
      result: {
        summary: "Blocked due to prompt injection attempt.",
        claims: [],
        guardrails: {
          passed: false,
          checks: [{ name: "safety (pre-flight)", passed: false, detail: inputCheck.detail }]
        }
      },
      trace
    };
  }

  trace.push({ step: "prepare", status: "ok", detail: `Validated input (${input.text.length} chars)` });

  const preparedText = input.text.slice(0, 8000);

  // DYNAMIC STEP 2: Reason
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

  // DYNAMIC STEP 3: Evaluate Output
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