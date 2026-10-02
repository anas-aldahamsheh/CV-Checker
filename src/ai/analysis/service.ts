import { geminiProvider } from "@/ai/provider/gemini";
import { jobExtractionPrompt, matchingPrompt, resumeExtractionPrompt } from "@/ai/prompts/contracts";
import { jobRequirementsSchema, matchingSchema, resumeEvidenceSchema } from "@/ai/schemas/extraction";
import type { JobRequirement, JobRequirements, RequirementMatch, ResumeEvidence } from "@/ats/contracts/analysis";
import { getServerEnv } from "@/lib/env";
import { jobIsGrounded, matchesAreGrounded, resumeIsGrounded } from "@/ai/validation/grounding";
import { extractJobFallback, extractResumeFallback } from "./fallback";
import { normalizeTerm } from "@/ats/normalization/text";

// The model sometimes returns only a handful of paraphrased evidence items. Add every summary,
// experience bullet and project line that appears verbatim in the resume so matching and scoring
// see the full, source-grounded evidence.
function withCompleteEvidence(resume: ResumeEvidence, resumeText: string): ResumeEvidence {
  const source = normalizeTerm(resumeText);
  const known = new Set(resume.evidenceItems.map((item) => normalizeTerm(item.text)));
  const evidenceItems = [...resume.evidenceItems];
  let next = evidenceItems.reduce((max, item) => Math.max(max, Number(item.id.slice(1)) || 0), 0);
  const candidates: Array<{ text: string; sourceSection: ResumeEvidence["evidenceItems"][number]["sourceSection"] }> = [
    ...(resume.summary ? [{ text: resume.summary, sourceSection: "summary" as const }] : []),
    ...resume.roles.flatMap((role) => role.bullets.map((text) => ({ text, sourceSection: "experience" as const }))),
    ...resume.projects.map((text) => ({ text, sourceSection: "projects" as const }))
  ];
  for (const candidate of candidates) {
    const normalized = normalizeTerm(candidate.text);
    if (evidenceItems.length >= 150 || !normalized || known.has(normalized) || !source.includes(normalized)) continue;
    known.add(normalized);
    evidenceItems.push({ id: `E${++next}`, text: candidate.text, sourceSection: candidate.sourceSection });
  }
  return { ...resume, evidenceItems };
}

export type AiMatchOutput = {
  matches: RequirementMatch[];
  seniorityAssessment?: {
    candidateLevel: string | null;
    jobRequiredLevel: string | null;
    status: "matched" | "underqualified" | "overqualified" | "unspecified";
    reason: string;
    specified?: boolean;
  };
  provider: "gemini" | "deterministic-fallback";
};

export async function extractAnalysisFacts(
  resumeText: string,
  jdText?: string,
  hyperlinks?: Array<{ url: string; label?: string }>
) {
  const env = getServerEnv();
  if (!env.GEMINI_API_KEY || !env.GEMINI_MODEL) {
    return {
      resume: extractResumeFallback(resumeText, hyperlinks),
      job: jdText ? extractJobFallback(jdText) : null,
      provider: "deterministic-fallback" as const
    };
  }

  try {
    let resumeInput = resumeText;
    if (hyperlinks && hyperlinks.length > 0) {
      const formattedLinks = hyperlinks
        .map((h) => (h.label ? `[${h.label}]: ${h.url}` : h.url))
        .join("\n");
      resumeInput += `\n\n[HYPERLINKS_METADATA]\n${formattedLinks}`;
    }

    const resume = await geminiProvider.generateStructured<ResumeEvidence>({
      system: resumeExtractionPrompt,
      input: resumeInput,
      schema: resumeEvidenceSchema,
      timeoutMs: env.AI_TIMEOUT_MS
    });

    const job = jdText
      ? await geminiProvider.generateStructured<JobRequirements>({
          system: jobExtractionPrompt,
          input: jdText,
          schema: jobRequirementsSchema,
          timeoutMs: env.AI_TIMEOUT_MS
        })
      : null;

    if (!resumeIsGrounded(resume, resumeText) || (job && !jobIsGrounded(job, jdText ?? ""))) {
      throw new Error("Ungrounded AI extraction");
    }

    return { resume: withCompleteEvidence(resume, resumeText), job, provider: "gemini" as const };
  } catch {
    return {
      resume: extractResumeFallback(resumeText, hyperlinks),
      job: jdText ? extractJobFallback(jdText) : null,
      provider: "deterministic-fallback" as const
    };
  }
}

export async function matchWithAi(resume: ResumeEvidence, job: JobRequirements | null): Promise<AiMatchOutput | null> {
  if (!job) {
    return { matches: [] as RequirementMatch[], provider: "deterministic-fallback" as const };
  }

  const env = getServerEnv();
  if (!env.GEMINI_API_KEY || !env.GEMINI_MODEL) return null;

  const requirements: JobRequirement[] =
    job.atomicRequirements && job.atomicRequirements.length > 0
      ? job.atomicRequirements
      : [
          ...job.hardSkills.map((item) => ({ ...item, kind: "skill" as const })),
          ...job.responsibilities.map((name, index) => ({
            id: `R${job.hardSkills.length + index + 1}`,
            name,
            importance: "required" as const,
            sourceText: name,
            kind: "responsibility" as const
          })),
          ...job.educationRequirements.map((name, index) => ({
            id: `R${job.hardSkills.length + job.responsibilities.length + index + 1}`,
            name,
            importance: "required" as const,
            sourceText: name,
            kind: "education" as const
          })),
          ...job.certificationRequirements.map((name, index) => ({
            id: `R${job.hardSkills.length + job.responsibilities.length + job.educationRequirements.length + index + 1}`,
            name,
            importance: "required" as const,
            sourceText: name,
            kind: "certification" as const
          }))
        ];

  try {
    const result = await geminiProvider.generateStructured<{
      matches: RequirementMatch[];
      seniorityAssessment?: {
        candidateLevel: string | null;
        jobRequiredLevel: string | null;
        status: "matched" | "underqualified" | "overqualified" | "unspecified";
        reason: string;
        specified?: boolean;
      };
    }>({
      system: matchingPrompt,
      input: JSON.stringify({
        jobTitle: job.jobTitle,
        requiredSeniority: job.seniority,
        senioritySpecified: job.senioritySpecified ?? false,
        requirements,
        candidateSeniority: resume.seniorityEstimate,
        skillsList: resume.skills,
        evidenceItems: resume.evidenceItems,
        roles: resume.roles.map((r) => ({ title: r.title, company: r.company, bullets: r.bullets }))
      }),
      schema: matchingSchema,
      timeoutMs: env.AI_TIMEOUT_MS
    });

    const enrichedMatches = result.matches.map((m) => {
      let multiplier = m.evidenceMultiplier;
      if (multiplier === undefined) {
        if (m.evidenceStrength === "strong") multiplier = 1.0;
        else if (m.evidenceStrength === "moderate") multiplier = 0.75;
        else if (m.evidenceStrength === "weak") multiplier = 0.4;
        else if (m.evidenceStrength === "keyword_only") multiplier = 0.2;
        else multiplier = 0.0;
      }
      return {
        ...m,
        evidenceMultiplier: multiplier
      };
    });

    if (
      !matchesAreGrounded(
        enrichedMatches,
        new Set(requirements.map((item) => item.id)),
        new Set(resume.evidenceItems.map((item) => item.id))
      )
    ) {
      return null;
    }

    return {
      matches: enrichedMatches,
      seniorityAssessment: result.seniorityAssessment,
      provider: "gemini" as const
    };
  } catch {
    return null;
  }
}
