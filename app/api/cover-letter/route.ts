import { NextResponse } from "next/server";
import { apiGuard, safeJson } from "@/lib/api";
import { generatorRequestSchema } from "@/features/generators/schemas";
import { generateCoverLetter } from "@/ai/analysis/generation";
export async function POST(request: Request) {
  const denied = apiGuard(request, 10, "cover-letter");
  if (denied) return denied;
  try {
    const input = generatorRequestSchema.parse(await safeJson(request));
    const text = await generateCoverLetter(
      input.resume,
      input.job ?? null,
      input.tone ?? "professional",
      input.locale
    );
    return NextResponse.json({ text }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The request could not be processed." }, { status: 400 });
  }
}
