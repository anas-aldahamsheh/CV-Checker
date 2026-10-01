import type { JobRequirements, RequirementMatch, ResumeEvidence } from "@/ats/contracts/analysis";
import { normalizeTerm } from "@/ats/normalization/text";

function wordOverlapRatio(source: string, claim: string): number {
  const normSource = normalizeTerm(source);
  const words = normalizeTerm(claim)
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  if (!words.length) return 1;
  const matched = words.filter((w) => normSource.includes(w)).length;
  return matched / words.length;
}

export function resumeIsGrounded(resume: ResumeEvidence, source: string): boolean {
  if (!source || source.trim().length < 10) return false;
  // Verify that the candidate data and evidence have reasonable connection to the source text
  const sampleClaims = [
    ...resume.skills.slice(0, 10),
    ...resume.roles.map((r) => r.title).slice(0, 5),
    ...resume.education.slice(0, 3)
  ];
  if (!sampleClaims.length) return true;

  const validSampleCount = sampleClaims.filter((claim) => wordOverlapRatio(source, claim) > 0.3).length;
  // Grounded if at least 50% of sampled claims have token overlap with source document
  return validSampleCount / sampleClaims.length >= 0.5;
}

export function jobIsGrounded(job: JobRequirements, source: string): boolean {
  if (!source || source.trim().length < 10) return false;
  const sampleRequirements = [
    ...job.hardSkills.map((h) => h.name).slice(0, 10),
    ...job.responsibilities.slice(0, 5)
  ];
  if (!sampleRequirements.length) return true;

  const validSampleCount = sampleRequirements.filter((req) => wordOverlapRatio(source, req) > 0.3).length;
  return validSampleCount / sampleRequirements.length >= 0.5;
}

export function matchesAreGrounded(
  matches: RequirementMatch[],
  requirementIds: Set<string>,
  evidenceIds: Set<string>
): boolean {
  return matches.every(
    (match) =>
      requirementIds.has(match.requirementId) &&
      (match.status === "not_found" ||
        match.evidenceIds.length === 0 ||
        match.evidenceIds.every((id) => evidenceIds.has(id)))
  );
}
