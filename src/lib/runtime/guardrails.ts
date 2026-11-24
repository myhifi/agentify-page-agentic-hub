import { z } from "zod";
import type { GuardrailResult } from "./types";

// 1. Upgraded Schema (requires at least 1 claim)
const outputSchema = z.object({
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  claims: z.array(z.string()).min(1, "At least one claim is required"),
});

// PRE-FLIGHT: Scan input for prompt injection before sending to LLM
export function evaluateInput(text: string): { passed: boolean; detail?: string } {
  const injectionPatterns = [
    /ignore (all )?previous instructions/i,
    /disregard (all )?previous/i,
    /system note:/i,
    /system prompt/i,
    /you must (reply|respond|output)/i,
    /include a claim that/i,
    /do not include any other text/i,
    /forget (all )?previous/i
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(text)) {
      return {
        passed: false,
        detail: `Prompt injection detected in input: matched "${pattern.source}"`
      };
    }
  }
  return { passed: true };
}

export function evaluateOutput(raw: unknown, sourceText: string): {
  parsed: { summary: string; claims: string[] };
  guardrails: GuardrailResult;
} {
  const checks: GuardrailResult["checks"] = [];

  // Check 1: Schema Validation
  const parsed = outputSchema.safeParse(raw);
  checks.push({
    name: "schema",
    passed: parsed.success,
    detail: parsed.success ? undefined : parsed.error.issues.map(i => i.message).join("; "),
  });

  if (!parsed.success) {
    return { parsed: { summary: "", claims: [] }, guardrails: { passed: false, checks } };
  }

  // Check 2: Groundedness (Token Containment + Exact Phrase Check)
  const sourceTokens = tokenSet(sourceText);
  const normalizedSource = sourceText.toLowerCase().replace(/[^\w\s]/g, "");

  const grounded = parsed.data.claims.every(claim => {
    const claimTokens = tokenSet(claim);
    if (claimTokens.size === 0) return false;

    // 2a. Token overlap (containment score)
    let overlap = 0;
    claimTokens.forEach(t => { if (sourceTokens.has(t)) overlap++; });
    const score = overlap / claimTokens.size;

    // 2b. Check if the claim is a direct substring (prevent shuffled words)
    const normalizedClaim = claim.toLowerCase().replace(/[^\w\s]/g, "");
    const isDirectMatch = normalizedSource.includes(normalizedClaim);

    // Pass if either it's a direct match, or 80% of its words exist in source
    return isDirectMatch || score >= 0.8;
  });

  checks.push({
    name: "groundedness",
    passed: grounded,
    detail: grounded ? "All claims are grounded in the source." : "One or more claims contain facts or phrasing not present in the source text.",
  });

  // Check 3: Safety & Prompt Injection (Regex-based)
  const unsafePatterns = [
    /ignore (all )?previous instructions/i,
    /system prompt/i,
    /you are now/i,
    /i cannot (summarize|provide|do)/i,
    /i('m| am) sorry/i,
    /as an ai/i,
    /<script/i
  ];
  
  const rawOutputString = `${parsed.data.summary} ${parsed.data.claims.join(" ")}`;
  const safe = !unsafePatterns.some(pattern => pattern.test(rawOutputString));

  checks.push({
    name: "safety",
    passed: safe,
    detail: safe ? "No safety violations detected." : "Output triggered a safety or prompt-injection filter.",
  });

  // Check 4: Plausibility / Fiction Notice
  // We flag explicit fiction as a "REVIEW" so the user knows the source text might be fictional, but we still allow the output to render.
  const fictionPatterns = [
    /fictional/i,
    /lunar hotel/i,
    /sci-fi/i,
    /time travel/i,
    /magic/i,
    /unicorn/i,
    /impossible/i,
    /alien/i
  ];
  
  const claimsText = parsed.data.claims.join(" ");
  const isPlausible = !fictionPatterns.some(pattern => pattern.test(claimsText));

  checks.push({
    name: "plausibility",
    passed: isPlausible,
    detail: isPlausible ? "Claims appear realistic." : "Warning: Source text contains explicit fictional or highly implausible claims.",
  });

  return {
    parsed: parsed.data,
    guardrails: {
      passed: checks.every(c => c.passed),
      checks,
    },
  };
}

// Helper: Extract meaningful tokens (removes stopwords and short words)
function tokenSet(text: string): Set<string> {
  const stop = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "is", "are", "was", "were", "be", "been", "being", "it", "its", "this", "that", "these", "those"]);
  return new Set(
    text.toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(t => t.length > 2 && !stop.has(t))
  );
}