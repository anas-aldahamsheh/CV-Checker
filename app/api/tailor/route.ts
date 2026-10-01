import { NextResponse } from "next/server";
import { apiGuard, safeJson } from "@/lib/api";
import { generatorRequestSchema } from "@/features/generators/schemas";
import { generateTailoring } from "@/ai/analysis/generation";
export async function POST(request: Request) { const denied = apiGuard(request, 10, "tailor"); if (denied) return denied; try { const input = generatorRequestSchema.parse(await safeJson(request)); if (input.originalBullet && !input.resume.evidenceItems.some((item) => item.text === input.originalBullet)) return NextResponse.json({ error: "The bullet must be copied from verified resume evidence." }, { status: 400 }); return NextResponse.json(await generateTailoring(input.resume, input.job, input.originalBullet, input.locale), { headers: { "Cache-Control": "no-store" } }); } catch { return NextResponse.json({ error: "The request could not be processed." }, { status: 400 }); } }
