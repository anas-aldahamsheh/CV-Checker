import { z } from "zod";

const cleanString = z.string().trim().min(1).max(3_000);
const nullableDate = z.string().trim().max(40).nullable();

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
  id: z.string().regex(/^R\d+$/),
  name: cleanString,
  importance: z.enum(["required", "preferred"]).default("required"),
  sourceText: cleanString,
  kind: z
    .enum([
      "skill",
      "responsibility",
      "education",
      "certification",
      "keyword",
      "experience_duration",
      "seniority",
      "soft_skill"
    ])
    .default("skill"),
  category: z.enum(["language", "framework", "cloud", "database", "tool", "general"]).optional(),
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
        id: z.string().regex(/^R\d+$/),
        name: cleanString,
        importance: z.enum(["required", "preferred"]),
        sourceText: cleanString,
        category: z.enum(["language", "framework", "cloud", "database", "tool", "general"]).optional()
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
});

export const matchingSchema = z.object({
  matches: z
    .array(
      z.object({
        requirementId: z.string().regex(/^R\d+$/),
        status: z.enum(["supported", "partial", "not_found"]),
        evidenceStrength: z.enum(["strong", "moderate", "weak", "keyword_only", "no_evidence", "missing"]).optional(),
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
      status: z.enum(["matched", "underqualified", "overqualified", "unspecified"]),
      reason: z.string().trim().max(500),
      specified: z.boolean().optional().default(false)
    })
    .optional()
});

export const generatedTextSchema = z.object({ text: z.string().trim().min(1).max(6_000) });
export const tailoringSchema = z.object({ summary: z.string().trim().min(1).max(1_200), suggestedBullet: z.string().trim().max(2_000).nullable() });
export const groundedGeneratedTextSchema = z.object({ text: z.string().trim().min(1).max(6_000), evidenceIds: z.array(z.string().regex(/^E\d+$/)).max(20).optional() });
export const groundedTailoringSchema = z.object({ summary: z.string().trim().min(1).max(1_200), suggestedBullet: z.string().trim().max(2_000).nullable(), evidenceIds: z.array(z.string().regex(/^E\d+$/)).max(20).optional() });
