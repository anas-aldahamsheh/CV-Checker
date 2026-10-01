import { z } from "zod";
import { jobRequirementsSchema, resumeEvidenceSchema } from "@/ai/schemas/extraction";
export const generatorRequestSchema = z.object({ resume: resumeEvidenceSchema, job: jobRequirementsSchema.nullable(), locale: z.enum(["ar", "en"]).default("en"), tone: z.enum(["professional", "concise", "enthusiastic"]).optional(), question: z.string().trim().min(1).max(2_000).optional(), context: z.string().trim().max(2_000).optional(), originalBullet: z.string().trim().max(2_000).optional() });
