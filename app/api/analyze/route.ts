import { z } from "zod";
import { NextResponse } from "next/server";
import { buildAnalysis } from "@/ats/analysis/engine";
import { extractAnalysisFacts, matchWithAi } from "@/ai/analysis/service";
import { apiGuard, safeJson } from "@/lib/api";

const requestSchema = z.object({
  resumeText: z.string().trim().min(1).max(100_000),
  jdText: z.string().trim().max(100_000).optional(),
  locale: z.enum(["ar", "en"]).default("en"),
  parse: z
    .object({
      status: z.enum(["good", "limited", "scanned", "failed"]).optional(),
      warnings: z.array(z.string().max(300)).max(10).optional(),
      characterCount: z.number().nonnegative().optional()
    })
    .optional(),
  hyperlinks: z
    .array(
      z.object({
        url: z.string().max(2_000),
        label: z.string().max(500).optional()
      })
    )
    .optional()
});

export async function POST(request: Request) {
  const denied = apiGuard(request, 10, "analyze");
  if (denied) return denied;

  try {
    const input = requestSchema.parse(await safeJson(request));
    const facts = await extractAnalysisFacts(input.resumeText, input.jdText, input.hyperlinks);
    const aiMatches = await matchWithAi(facts.resume, facts.job);

    const result = buildAnalysis({
      resume: facts.resume,
      job: facts.job,
      resumeText: input.resumeText,
      parseHint: input.parse,
      provider: aiMatches?.provider ?? facts.provider,
      matches: aiMatches?.matches,
      seniorityAssessment: aiMatches?.seniorityAssessment,
      locale: input.locale
    });

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json(
      { error: "We could not analyze this content. Confirm the resume text and job description are valid." },
      { status: 400 }
    );
  }
}
