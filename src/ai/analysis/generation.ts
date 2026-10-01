import { geminiProvider } from "@/ai/provider/gemini";
import { coverLetterPrompt } from "@/ai/prompts/contracts";
import { generatedTextSchema, groundedTailoringSchema } from "@/ai/schemas/extraction";
import type { JobRequirements, ResumeEvidence } from "@/ats/contracts/analysis";
import { getServerEnv } from "@/lib/env";
import { createApplicationAnswer, createCoverLetter, rewriteBullet, tailorSummary } from "@/features/generators/grounded";

async function structuredGeneration(fallback: string, payload: object) {
  const env = getServerEnv();
  if (!env.GEMINI_API_KEY || !env.GEMINI_MODEL) return fallback;
  try {
    const source = JSON.stringify(payload);
    const result = await geminiProvider.generateStructured<{ text: string }>({
      system: `${coverLetterPrompt} Output valid JSON: { "text": "..." }`,
      input: source,
      schema: generatedTextSchema,
      timeoutMs: env.AI_TIMEOUT_MS
    });
    if (result.text && result.text.trim().length > 30) {
      return result.text.trim();
    }
    return fallback;
  } catch (err) {
    console.warn("AI generation fallback triggered:", err);
    return fallback;
  }
}

export function generateCoverLetter(
  resume: ResumeEvidence,
  job: JobRequirements | null,
  tone: "professional" | "concise" | "enthusiastic" = "professional",
  locale: "ar" | "en" = "en"
) {
  const fallback = createCoverLetter(resume, job, tone, locale);
  return structuredGeneration(fallback, {
    task: job ? "cover_letter_job_tailored" : "cover_letter_general",
    locale,
    tone,
    targetRole: job?.jobTitle || null,
    jobRequirements: job
      ? {
          requiredSkills: job.hardSkills.filter((s) => s.importance === "required").map((s) => s.name),
          responsibilities: job.responsibilities.slice(0, 5)
        }
      : null,
    candidateSummary: resume.summary,
    candidateRoles: resume.roles.map((r) => ({
      title: r.title,
      company: r.company,
      keyAchievements: r.bullets.slice(0, 3)
    })),
    candidateSkills: resume.skills.slice(0, 15),
    candidateProjects: resume.projects.slice(0, 3)
  });
}

export function generateApplicationAnswer(
  resume: ResumeEvidence,
  job: JobRequirements | null,
  question: string,
  context?: string,
  locale: "ar" | "en" = "en"
) {
  const fallback = createApplicationAnswer(resume, question, context, locale);
  return structuredGeneration(fallback, {
    task: "application_answer",
    locale,
    question,
    context: context || null,
    targetRole: job?.jobTitle ?? null,
    candidateEvidence: resume.evidenceItems.map((e) => e.text).slice(0, 8)
  });
}

export async function generateTailoring(
  resume: ResumeEvidence,
  job: JobRequirements | null,
  originalBullet?: string,
  locale: "ar" | "en" = "en"
) {
  const fallback = {
    summary: tailorSummary(resume, job, locale),
    originalBullet: originalBullet ?? null,
    suggestedBullet: originalBullet ? rewriteBullet(originalBullet) : null
  };

  const env = getServerEnv();
  if (!env.GEMINI_API_KEY || !env.GEMINI_MODEL) return fallback;

  try {
    const payload = {
      locale,
      jobTitle: job?.jobTitle ?? null,
      skills: resume.skills.slice(0, 10),
      originalBullet: originalBullet ?? null
    };
function validEvidenceIds(ids: string[] | undefined, resume: ResumeEvidence) {
  if (!ids || ids.length === 0) return true;
  const known = new Set(resume.evidenceItems.map((item) => item.id));
  return ids.every((id) => known.has(id));
}

    const result = await geminiProvider.generateStructured<{
      summary: string;
      suggestedBullet: string | null;
      evidenceIds?: string[];
    }>({
      system: "Generate a tailored professional summary and optionally rewrite the bullet to highlight impact without inventing facts. Output JSON: { summary, suggestedBullet, evidenceIds }.",
      input: JSON.stringify(payload),
      schema: groundedTailoringSchema,
      timeoutMs: env.AI_TIMEOUT_MS
    });
    if (!validEvidenceIds(result.evidenceIds, resume)) {
      return fallback;
    }
    return {
      summary: result.summary,
      originalBullet: originalBullet ?? null,
      suggestedBullet: result.suggestedBullet
    };
  } catch {
    return fallback;
  }
}
