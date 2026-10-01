import { afterEach, describe, expect, it, vi } from "vitest";
import { generateTailoring } from "../src/ai/analysis/generation";
import { extractResumeFallback } from "../src/ai/analysis/fallback";
import { geminiProvider } from "../src/ai/provider/gemini";
import { createCoverLetter } from "../src/features/generators/grounded";
const originalKey = process.env.GEMINI_API_KEY;
const originalModel = process.env.GEMINI_MODEL;
afterEach(() => { if (originalKey) process.env.GEMINI_API_KEY = originalKey; else delete process.env.GEMINI_API_KEY; if (originalModel) process.env.GEMINI_MODEL = originalModel; else delete process.env.GEMINI_MODEL; vi.restoreAllMocks(); });
describe("grounded tailoring fallback", () => { it("preserves the selected verified bullet", async () => { const resume = extractResumeFallback("Alex\nExperience\n• Built a React dashboard for reporting.\nSkills\nReact"); const bullet = resume.evidenceItems.find((item) => item.sourceSection === "experience")?.text; expect(bullet).toBeTruthy(); const result = await generateTailoring(resume, null, bullet); expect(result.originalBullet).toBe(bullet); expect(result.suggestedBullet).toContain("Built a React dashboard"); }); });
describe("grounded tailoring validation", () => { it("falls back when an AI result cites an unknown evidence ID", async () => { process.env.GEMINI_API_KEY = "test"; process.env.GEMINI_MODEL = "test-model"; const resume = extractResumeFallback("Alex\nExperience\n• Built a React dashboard for reporting.\nSkills\nReact"); vi.spyOn(geminiProvider, "generateStructured").mockResolvedValue({ summary: "Invented claim", suggestedBullet: null, evidenceIds: ["E999"] }); const result = await generateTailoring(resume, null); expect(result.summary).not.toBe("Invented claim"); }); });
describe("Arabic grounded fallback", () => {
  it("uses Arabic surrounding copy without adding facts", () => {
    const resume = extractResumeFallback("علي\nالخبرات\n• طورت لوحة React للتقارير\nالمهارات\nReact");
    const text = createCoverLetter(resume, { jobTitle: "مطور واجهات", seniority: null, requiredYears: null, hardSkills: [], responsibilities: [], educationRequirements: [], certificationRequirements: [], keywords: [], softSkills: [] }, "professional", "ar");
    expect(text).toContain("فريق التوظيف المحترم");
    expect(text).toContain("طورت لوحة React للتقارير");
  });

  it("generates a general cover letter when no job description is provided", () => {
    const resume = extractResumeFallback("علي\nالخبرات\n• طورت لوحة React للتقارير\nالمهارات\nReact");
    const textAr = createCoverLetter(resume, null, "professional", "ar");
    expect(textAr).toContain("فريق التوظيف المحترم");
    expect(textAr).toContain("طورت لوحة React للتقارير");

    const textEn = createCoverLetter(resume, null, "professional", "en");
    expect(textEn).toContain("Dear Hiring Team");
    expect(textEn).toContain("opportunities matching my professional background");
  });
});
