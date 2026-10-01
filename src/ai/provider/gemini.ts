import { getServerEnv } from "@/lib/env";
import type { AiProvider, StructuredRequest, TextRequest } from "./types";

async function requestGemini(prompt: string, timeoutMs = 20_000) {
  const { GEMINI_API_KEY, GEMINI_MODEL, AI_MAX_OUTPUT_TOKENS } = getServerEnv();
  if (!GEMINI_API_KEY || !GEMINI_MODEL) throw new Error("AI provider is not configured");
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try { const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", maxOutputTokens: AI_MAX_OUTPUT_TOKENS } }), signal: controller.signal }); if (!response.ok) throw new Error("AI provider request failed"); const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] }; const output = data.candidates?.[0]?.content?.parts?.[0]?.text; if (!output) throw new Error("AI provider returned no text"); return output; } finally { clearTimeout(timeout); }
}

export const geminiProvider: AiProvider = { async generateStructured<T>(request: StructuredRequest<T>) { const raw = await requestGemini(`${request.system}\nReturn only valid JSON.\n${request.input}`, request.timeoutMs); return request.schema.parse(JSON.parse(raw)); }, async generateText(request: TextRequest) { return requestGemini(`${request.system}\n${request.input}`, request.timeoutMs); } };
