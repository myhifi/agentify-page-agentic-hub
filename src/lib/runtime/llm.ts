import type { LLMConfig } from "./types";

export async function callLLM(config: LLMConfig, system: string, user: string): Promise<unknown> {
  if (config.provider === "gemini") {
    return callGemini(config, system, user);
  }
  if (config.provider === "groq") {
    return callGroq(config, system, user);
  }
  if (config.provider === "otari") {
    return callOtari(config, system, user);
  }
  throw new Error(`Unsupported provider: ${config.provider}`);
}

async function callGemini(config: LLMConfig, system: string, user: string): Promise<unknown> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no text");
  return JSON.parse(text);
}

async function callGroq(config: LLMConfig, system: string, user: string): Promise<unknown> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned no text");
  return JSON.parse(text);
}

async function callOtari(config: LLMConfig, system: string, user: string): Promise<unknown> {
  // Otari's OpenAI-compatible endpoint
  const url = "https://api.otari.ai/api/v1/chat/completions";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });
  if (!res.ok) throw new Error(`Otari error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Otari returned no text");
  return JSON.parse(text);
}