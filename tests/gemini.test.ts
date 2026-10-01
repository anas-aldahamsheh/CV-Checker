import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { geminiProvider } from "../src/ai/provider/gemini";

const originalFetch = globalThis.fetch;
const originalKey = process.env.GEMINI_API_KEY;
const originalModel = process.env.GEMINI_MODEL;
afterEach(() => { globalThis.fetch = originalFetch; if (originalKey) process.env.GEMINI_API_KEY = originalKey; else delete process.env.GEMINI_API_KEY; if (originalModel) process.env.GEMINI_MODEL = originalModel; else delete process.env.GEMINI_MODEL; vi.restoreAllMocks(); });
describe("Gemini adapter", () => { it("rejects malformed structured output", async () => { process.env.GEMINI_API_KEY = "test"; process.env.GEMINI_MODEL = "test-model"; globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "not json" }] } }] }), { status: 200 })); await expect(geminiProvider.generateStructured({ system: "test", input: "test", schema: z.object({ value: z.string() }) })).rejects.toThrow(); }); });
describe("Gemini adapter timeouts", () => { it("aborts a provider request after the supplied timeout", async () => { process.env.GEMINI_API_KEY = "test"; process.env.GEMINI_MODEL = "test-model"; globalThis.fetch = vi.fn().mockImplementation((_url, init: RequestInit) => new Promise((_, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))))); await expect(geminiProvider.generateStructured({ system: "test", input: "test", schema: z.object({ value: z.string() }), timeoutMs: 1 })).rejects.toThrow(); }); });
