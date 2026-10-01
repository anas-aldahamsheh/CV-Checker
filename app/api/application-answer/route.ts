import { NextResponse } from "next/server";
import { apiGuard, safeJson } from "@/lib/api";
import { generatorRequestSchema } from "@/features/generators/schemas";
import { generateApplicationAnswer } from "@/ai/analysis/generation";
export async function POST(request: Request) { const denied = apiGuard(request, 10, "application-answer"); if (denied) return denied; try { const input = generatorRequestSchema.parse(await safeJson(request)); if (!input.question) return NextResponse.json({ error: "An application question is required." }, { status: 400 }); return NextResponse.json({ text: await generateApplicationAnswer(input.resume, input.job, input.question, input.context, input.locale) }, { headers: { "Cache-Control": "no-store" } }); } catch { return NextResponse.json({ error: "The request could not be processed." }, { status: 400 }); } }
