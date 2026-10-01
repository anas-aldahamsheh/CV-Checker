import { NextResponse } from "next/server";
import { getServerEnv, validateUpload } from "@/lib/env";
import { apiGuard } from "@/lib/api";
import { parseResume } from "@/features/resume-parser/parse-resume";

export const runtime = "nodejs";
export async function POST(request: Request) { const maxBytes = getServerEnv().MAX_UPLOAD_BYTES + 100_000; const denied = apiGuard(request, 10, "parse-resume", maxBytes); if (denied) return denied; try { const formData = await request.formData(); const value = formData.get("file"); if (!(value instanceof File)) return NextResponse.json({ error: "A resume file is required." }, { status: 400 }); const validation = validateUpload(value); if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 }); return NextResponse.json(await parseResume(value, validation.extension), { headers: { "Cache-Control": "no-store" } }); } catch (error) { console.error("resume_parse_failed", error instanceof Error ? error.message : "unknown_error"); return NextResponse.json({ error: "The resume could not be parsed. Use a text-based PDF, DOCX, or TXT file." }, { status: 422 }); } }
