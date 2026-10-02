import { z } from "zod";

const cleanString = z.string().trim().min(1).max(3_000);
const nullableDate = z.string().trim().max(40).nullable();

// Models do not always use the exact enum wording (for example "skill" or "frameworks"
// as a category). Normalize the value and fall back instead of rejecting the whole extraction.
function lenientEnum<const T extends readonly [string, ...string[]]>(values: T, fallback: T[number], aliases: Record<string, T[number]> = {}) {
  return z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
    if ((values as readonly string[]).includes(key)) return key;
    if (aliases[key]) return aliases[key];
    const singular = key.replace(/s$/, "");
    if ((values as readonly string[]).includes(singular)) return singular;
    return fallback;
  }, z.enum(values));
}

const skillCategory = lenientEnum(["language", "framework", "cloud", "database", "tool", "general"] as const, "general", {
  programming_language: "language",
  library: "framework",
  platform: "cloud",
  devops: "tool"
});
// Requirement ids are model-assigned; some models label preferred items "P1", "P2"...
// Accept any short id here and renumber invalid or duplicate ones to free "R<n>" ids below.
const requirementId = z.string().trim().min(1).max(40);

function normalizeRequirementIds<T extends { id: string }>(items: T[]): T[] {
  const used = new Set<string>();
  const valid = (id: string) => /^R\d+$/.test(id);
  for (const item of items) if (valid(item.id)) used.add(item.id);
  const seen = new Set<string>();
  let next = 1;
  return items.map((item) => {
    if (valid(item.id) && !seen.has(item.id)) {
      seen.add(item.id);
      return item;
    }
    while (used.has(`R${next}`)) next += 1;
    const id = `R${next}`;
    used.add(id);
    seen.add(id);
    return { ...item, id };
  });
}

const requirementImportance = lenientEnum(["required", "preferred"] as const, "required", {
  must_have: "required",
  mandatory: "required",
  nice_to_have: "preferred",
  optional: "preferred",
  bonus: "preferred"
});

export const linkItemSchema = z.object({
  present: z.boolean().default(false),
  labelDetected: z.boolean().default(false),
  urlDetected: z.boolean().default(false),
  url: z.string().nullable().default(null),
  status: z.enum(["verified", "label_present_url_unverified", "missing"]).default("missing")
});

export const sectionItemSchema = z.object({
  present: z.boolean().default(false),
  detectedHeading: z.string().nullable().default(null)
});

export const detectedSectionsSchema = z.object({
  summary: sectionItemSchema.optional(),
  experience: sectionItemSchema.optional(),
  education: sectionItemSchema.optional(),
  skills: sectionItemSchema.optional(),
  projects: sectionItemSchema.optional(),
  certifications: sectionItemSchema.optional(),
  languages: sectionItemSchema.optional()
});

export const categorizedSkillsSchema = z.object({
  languages: z.array(cleanString).default([]),
  frameworks: z.array(cleanString).default([]),
  cloud: z.array(cleanString).default([]),
  databases: z.array(cleanString).default([]),
  tools: z.array(cleanString).default([]),
  spokenLanguages: z.array(cleanString).default([])
});

export const bulletAchievementSchema = z.object({
  text: cleanString,
  classification: z
    .enum([
      "strong_achievement",
      "moderate_achievement",
      "weak_achievement",
      "responsibility_duty",
      "descriptive"
    ])
    .default("responsibility_duty"),
  metricPresent: z.boolean().default(false),
  metrics: z
    .array(
      z.object({
        type: z.string().trim().max(100),
        value: z.string().trim().max(200)
      })
    )
    .default([]),
  impactTypes: z.array(z.string().trim().max(100)).default([]),
  ownershipStrength: z.enum(["high", "medium", "low"]).default("medium"),
  evidenceStrength: z.enum(["strong", "moderate", "weak", "none"]).default("weak"),
  hasClearOutcome: z.boolean().default(false),
  reasoningSummary: z.string().trim().max(1000).default("")
});

export const resumeEvidenceSchema = z.object({
  candidate: z.object({
    name: z.string().trim().max(200).nullable().default(null),
    email: z.string().trim().max(320).nullable().default(null),
    phone: z.string().trim().max(80).nullable().default(null),
    location: z.string().trim().max(300).nullable().default(null),
    locationStatus: z.enum(["present", "missing", "partially_present", "ambiguous"]).optional(),
    links: z.array(z.string().max(2_000)).max(20).default([]),
    linksDetails: z
      .object({
        linkedin: linkItemSchema.optional(),
        github: linkItemSchema.optional(),
        portfolio: linkItemSchema.optional(),
        website: linkItemSchema.optional()
      })
      .optional()
  }),
  summary: z.string().trim().max(3_000).default(""),
  seniorityEstimate: z.string().trim().max(100).nullable().optional(),
  roles: z
    .array(
      z.object({
        title: cleanString,
        company: z.string().trim().max(300),
        startDate: nullableDate,
        endDate: nullableDate,
        bullets: z.array(cleanString).max(30).default([])
      })
    )
    .max(30)
    .default([]),
  skills: z.array(cleanString).max(100).default([]),
  categorizedSkills: categorizedSkillsSchema.optional(),
  education: z.array(cleanString).max(30).default([]),
  certifications: z.array(cleanString).max(30).default([]),
  projects: z.array(cleanString).max(30).default([]),
  evidenceItems: z
    .array(
      z.object({
        id: z.string().regex(/^E\d+$/),
        text: cleanString,
        sourceSection: z.enum(["summary", "experience", "skills", "education", "certifications", "projects", "other"])
      })
    )
    .max(150)
    .default([]),
  detectedSections: detectedSectionsSchema.optional(),
  bulletAchievements: z.array(bulletAchievementSchema).max(100).optional(),
  achievementExplanation: z.string().trim().max(2000).optional()
});

export const atomicRequirementSchema = z.object({
  id: requirementId,
  name: cleanString,
  importance: requirementImportance.default("required"),
  sourceText: cleanString,
  kind: lenientEnum(
    ["skill", "responsibility", "education", "certification", "keyword", "experience_duration", "seniority", "soft_skill"] as const,
    "skill",
    { hard_skill: "skill", technical_skill: "skill", experience: "experience_duration", years: "experience_duration" }
  ).default("skill"),
  category: skillCategory.optional(),
  atomicDecomposition: z.array(cleanString).optional()
});

export const jobRequirementsSchema = z.object({
  jobTitle: z.string().trim().max(300),
  seniority: z.string().trim().max(100).nullable().default(null),
  senioritySpecified: z.boolean().optional().default(false),
  requiredYears: z.number().min(0).max(60).nullable().default(null),
  yearsSpecified: z.boolean().optional().default(false),
  hardSkills: z
    .array(
      z.object({
        id: requirementId,
        name: cleanString,
        importance: requirementImportance,
        sourceText: cleanString,
        category: skillCategory.optional()
      })
    )
    .max(100)
    .default([]),
  responsibilities: z.array(cleanString).max(50).default([]),
  educationRequirements: z.array(cleanString).max(30).default([]),
  certificationRequirements: z.array(cleanString).max(30).default([]),
  keywords: z.array(cleanString).max(100).default([]),
  softSkills: z.array(cleanString).max(50).default([]),
  atomicRequirements: z.array(atomicRequirementSchema).max(150).optional()
}).transform((job) => ({
  ...job,
  hardSkills: normalizeRequirementIds(job.hardSkills),
  atomicRequirements: job.atomicRequirements ? normalizeRequirementIds(job.atomicRequirements) : undefined
}));

export const matchingSchema = z.object({
  matches: z
    .array(
      z.object({
        requirementId: z.string().regex(/^R\d+$/),
        status: lenientEnum(["supported", "partial", "not_found"] as const, "not_found", { matched: "supported", met: "supported", partially_supported: "partial", missing: "not_found", unsupported: "not_found" }),
        evidenceStrength: lenientEnum(["strong", "moderate", "weak", "keyword_only", "no_evidence", "missing"] as const, "no_evidence", { none: "no_evidence", keyword: "keyword_only" }).optional(),
        evidenceMultiplier: z.number().min(0).max(1).optional(),
        evidenceIds: z.array(z.string().regex(/^E\d+$/)).max(20).default([]),
        reason: z.string().trim().min(1).max(600),
        confidence: z.number().min(0).max(1)
      })
    )
    .max(200),
  seniorityAssessment: z
    .object({
      candidateLevel: z.string().trim().max(100).nullable().default(null),
      jobRequiredLevel: z.string().trim().max(100).nullable().default(null),
      status: lenientEnum(["matched", "underqualified", "overqualified", "unspecified"] as const, "unspecified", {
        supported: "matched",
        aligned: "matched",
        meets: "matched",
        under_qualified: "underqualified",
        over_qualified: "overqualified"
      }),
      reason: z.string().trim().max(500),
      specified: z.boolean().optional().default(false)
    })
    .optional()
});

export const generatedTextSchema = z.object({ text: z.string().trim().min(1).max(6_000) });
export const tailoringSchema = z.object({ summary: z.string().trim().min(1).max(1_200), suggestedBullet: z.string().trim().max(2_000).nullable() });
export const groundedGeneratedTextSchema = z.object({ text: z.string().trim().min(1).max(6_000), evidenceIds: z.array(z.string().regex(/^E\d+$/)).max(20).optional() });
export const groundedTailoringSchema = z.object({ summary: z.string().trim().min(1).max(1_200), suggestedBullet: z.string().trim().max(2_000).nullable(), evidenceIds: z.array(z.string().regex(/^E\d+$/)).max(20).optional() });
