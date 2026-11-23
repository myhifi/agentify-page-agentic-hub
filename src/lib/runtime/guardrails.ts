import { z } from "zod";
import type { GuardrailResult } from "./types";

const outputSchema = z.object({
  summary: z.string().min(10),
  claims: z.array(z.string()).min(1),
});

export function evaluateOutput(raw: unknown, sourceText: string): {
  parsed: { summary: string; claims: string[] };
  guardrails: GuardrailResult;
} {
  const checks: GuardrailResult["checks"] = [];

  // 1. Schema validation
  const parsed = outputSchema.safeParse(raw);
  checks.push({
    name: "schema",
    passed: parsed.success,
    detail: parsed.success ? undefined : parsed.error.issues.map(i => i.message).join("; "),
  });

  if (!parsed.success) {
    return { parsed: { summary: "", claims: [] }, guardrails: { passed: false, checks } };
  }

  // 2. Groundedness: each claim must share >=60% of tokens with source
  const sourceTokens = tokenSet(sourceText);
  const grounded = parsed.data.claims.every(claim => {
    const claimTokens = tokenSet(claim);
    if (claimTokens.size === 0) return false;
    let overlap = 0;
    claimTokens.forEach(t => { if (sourceTokens.has(t)) overlap++; });
    return overlap / claimTokens.size >= 0.6;
  });
  checks.push({
    name: "groundedness",
    passed: grounded,
    detail: grounded ? undefined : "One or more claims are not sufficiently grounded in the source text.",
  });

  // 3. Safety / refusal filter
  const forbidden = ["i cannot", "i'm sorry", "as an ai"];
  const safe = !forbidden.some(f => parsed.data.summary.toLowerCase().includes(f));
  checks.push({
    name: "safety",
    passed: safe,
    detail: safe ? undefined : "Output contains a refusal phrase.",
  });

  return {
    parsed: parsed.data,
    guardrails: {
      passed: checks.every(c => c.passed),
      checks,
    },
  };
}

function tokenSet(text: string): Set<string> {
  const stop = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "is", "are", "was", "were", "be", "been", "being", "it", "its", "this", "that", "these", "those"]);
  return new Set(
    text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(t => t.length > 2 && !stop.has(t))
  );
}