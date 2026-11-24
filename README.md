# AgentifyPage Agentic Hub

A browser-native, open agentic web MVP built for the **Open Agentic Web Challenge**. 

This project demonstrates how agents can run entirely in the browser, discover capabilities via a public `.json` manifest, and use output evaluation (guardrails) to prevent hallucinations, block prompt injections, and ensure trust.

## 🚀 Live Demo & Specification Compliance
* **Live Application:** [https://agentify-page-agentic-hub.vercel.app/](https://agentify-page-agentic-hub.vercel.app/)
* **Public Manifest:** `/.well-known/agent-manifest.json`
* **Browser Runtime:** `/runtime.js` (Self-contained ES module)
* **Interface:** React-based UI (Next.js App Router)
* **BYOK:** 100% Client-side Bring-Your-Own-Key for Gemini, Groq, and Otari. No API keys are stored on any server.

## 🧠 Architecture
The agent execution follows a strict multi-step flow designed for safety:
1. **Prepare:** Validates input against the network's dynamic JSON schema (minimum character length).
2. **Pre-flight Guardrails:** Scans the input text for prompt-injection patterns (e.g., "ignore previous instructions", "system note:") to block malicious inputs *before* they reach the LLM.
3. **Reason:** Calls the LLM via BYOK to generate a summary and extract claims.
4. **Evaluate:** Runs local, zero-latency guardrails:
   - `Schema`: Validates JSON structure using Zod.
   - `Groundedness`: Uses a strict Token Containment algorithm (checking for direct substring matches or 80% token overlap) to ensure claims are mathematically backed by the source text.
   - `Safety`: Uses Regex pattern matching to block refusal phrases and system prompt leakage.
   - `Plausibility`: Scans claims for explicit fiction/implausibility (e.g., "lunar hotel") to warn the user without blocking the output.

If any check fails, the UI displays an amber **REVIEW** badge and explains exactly which guardrail triggered. Otherwise, it shows a green **PASSED** badge.

## 🛠️ How to Run Locally
1. Clone the repo and run `npm install`.
2. Run `npm run build:runtime` (builds the self-contained browser runtime via esbuild).
3. Run `npm run dev` and open `http://localhost:3000`.
4. Go to [Google AI Studio](https://aistudio.google.com/) or [Groq Console](https://console.groq.com/), get a free API key, and paste it into the BYOK settings. (Keys are saved in your browser's local storage).

## 🧪 Demo Scenarios
- **Hackathon Rules / Tech News:** Demonstrates successful multi-step summarization with grounded claims (`PASSED`).
- **Prompt Injection:** Demonstrates the pre-flight guardrail catching a malicious instruction and failing the safety check before the LLM is even called (`REVIEW`).
- **Mixed Fiction:** Demonstrates the agent summarizing a text that includes fictional elements (like a "lunar hotel"), passing groundedness but triggering the plausibility warning (`REVIEW`).

## 🌐 Deployment
This app is configured for static export (`output: "export"` in `next.config.js`). It can be deployed for free on Vercel or Cloudflare Pages.