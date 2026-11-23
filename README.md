# AgentifyPage Agentic Hub

A browser-native, open agentic web MVP built for the **Open Agentic Web Challenge**. 

This project demonstrates how agents can run entirely in the browser, discover capabilities via a public `.json` manifest, and use output evaluation (guardrails) to prevent hallucinations and ensure trust.

## 🚀 Live Demo & Specification Compliance
* **Live Application:** [https://agentify-page-agentic-hub.vercel.app/](https://agentify-page-agentic-hub.vercel.app/)
- **Public Manifest:** `/.well-known/agent-manifest.json`
- **Browser Runtime:** `/runtime.js` (Self-contained ES module)
- **Interface:** React-based UI (Next.js App Router)
- **BYOK:** 100% Client-side Bring-Your-Own-Key for Gemini and Groq. No API keys are stored on any server.

## 🧠 Architecture
The agent execution follows a strict 3-step flow:
1. **Prepare:** Normalizes and extracts context from the pasted web content.
2. **Reason:** Calls the LLM via BYOK to generate a summary and extract claims.
3. **Evaluate:** Runs local, zero-latency guardrails:
   - `Schema`: Validates JSON output using Zod.
   - `Groundedness`: Uses Jaccard-style token overlap to ensure claims are backed by the source text.
   - `Safety`: Blocks refusal phrases or unsafe outputs.

If any check fails, the UI displays an amber **REVIEW** badge. Otherwise, it shows a green **PASSED** badge.

## 🛠️ How to Run Locally
1. Clone the repo and run `npm install`.
2. Run `npm run build:runtime` (builds the self-contained browser runtime).
3. Run `npm run dev` and open `http://localhost:3000`.
4. Go to [Google AI Studio](https://aistudio.google.com/), get a free API key, and paste it into the BYOK settings. (Keys are saved in your browser's local storage).

## 🧪 Demo Scenarios
- **Tech News:** Demonstrates a successful multi-step summarization with grounded claims (`PASSED`).
- **Prompt Injection:** Demonstrates the guardrail catching a malicious instruction and correctly failing the safety check (`REVIEW`).

## 🌐 Deployment
This app is configured for static export (`output: "export"` in `next.config.js`). It can be deployed for free on Vercel or Cloudflare Pages.