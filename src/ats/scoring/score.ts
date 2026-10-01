import type { AtsComponents, JobRequirement, RequirementMatch } from "@/ats/contracts/analysis";

export const ATS_WEIGHTS = {
  parseability: 15,
  contact: 5,
  sections: 10,
  roleAlignment: 10,
  hardSkills: 20,
  experience: 20,
  keywords: 10,
  achievements: 10
} as const;

export const RESUME_HEALTH_WEIGHTS = {
  parseability: 25,
  contact: 20,
  sections: 25,
  achievements: 30
} as const;

export const JOB_MATCH_WEIGHTS = {
  roleAlignment: 20,
  hardSkills: 35,
  experience: 25,
  keywords: 20
} as const;

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function evidenceMultiplierFor(
  strength?: RequirementMatch["evidenceStrength"],
  explicitMultiplier?: number
): number {
  if (typeof explicitMultiplier === "number") return clamp(explicitMultiplier);
  switch (strength) {
    case "strong":
      return 1.0;
    case "moderate":
      return 0.75;
    case "weak":
      return 0.4;
    case "keyword_only":
      return 0.2;
    case "no_evidence":
    case "missing":
    default:
      return 0.0;
  }
}

export function weightedCoverage(requirements: JobRequirement[], matches: RequirementMatch[]): number {
  if (!requirements.length) return 1;
  const lookup = new Map(matches.map((match) => [match.requirementId, match]));
  let totalWeight = 0;
  let earnedScore = 0;

  for (const requirement of requirements) {
    const weight = requirement.importance === "required" ? 2 : 1;
    totalWeight += weight;

    const match = lookup.get(requirement.id);
    if (!match) continue;

    if (match.status === "not_found") {
      earnedScore += 0;
    } else {
      const multiplier = evidenceMultiplierFor(match.evidenceStrength, match.evidenceMultiplier);
      const effectiveMultiplier = multiplier > 0 ? multiplier : match.status === "supported" ? 0.75 : 0.4;
      earnedScore += weight * effectiveMultiplier;
    }
  }

  return totalWeight ? earnedScore / totalWeight : 1;
}

export function calculateAtsScore(components: AtsComponents): number {
  let totalWeight = 0;
  let weightedSum = 0;

  const add = (weight: number, val: number | null | undefined) => {
    if (val !== null && val !== undefined) {
      totalWeight += weight;
      weightedSum += weight * clamp(val);
    }
  };

  add(ATS_WEIGHTS.parseability, components.parseability);
  add(ATS_WEIGHTS.contact, components.contact);
  add(ATS_WEIGHTS.sections, components.sections);
  add(ATS_WEIGHTS.roleAlignment, components.roleAlignment);
  add(ATS_WEIGHTS.hardSkills, components.hardSkills);
  add(ATS_WEIGHTS.experience, components.experience);
  add(ATS_WEIGHTS.keywords, components.keywords);
  add(ATS_WEIGHTS.achievements, components.achievements);

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;
}

export function calculateJobMatchScore(components: AtsComponents): number | null {
  if (components.roleAlignment === null || components.keywords === null) return null;

  let totalWeight = 0;
  let weightedSum = 0;

  const add = (weight: number, val: number | null | undefined) => {
    if (val !== null && val !== undefined) {
      totalWeight += weight;
      weightedSum += weight * clamp(val);
    }
  };

  add(JOB_MATCH_WEIGHTS.roleAlignment, components.roleAlignment);
  add(JOB_MATCH_WEIGHTS.hardSkills, components.hardSkills);
  add(JOB_MATCH_WEIGHTS.experience, components.experience);
  add(JOB_MATCH_WEIGHTS.keywords, components.keywords);

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;
}

export function calculateResumeQuality(components: AtsComponents): number {
  return Math.round(
    RESUME_HEALTH_WEIGHTS.parseability * clamp(components.parseability) +
      RESUME_HEALTH_WEIGHTS.contact * clamp(components.contact) +
      RESUME_HEALTH_WEIGHTS.sections * clamp(components.sections) +
      RESUME_HEALTH_WEIGHTS.achievements * clamp(components.achievements)
  );
}

export function calculateConfidence(
  parseability: number,
  hasJob: boolean,
  evidenceCount: number,
  provider: "gemini" | "deterministic-fallback"
): number {
  const source = provider === "gemini" ? 1 : 0.65;
  return Math.round(
    100 *
      clamp(
        parseability * 0.4 +
          (hasJob ? 0.2 : 0.1) +
          Math.min(1, evidenceCount / 8) * 0.25 +
          source * 0.15
      )
  );
}
