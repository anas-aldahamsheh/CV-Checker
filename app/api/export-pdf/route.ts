import { NextResponse } from "next/server";
import { chromium } from "playwright";
import { z } from "zod";
import { apiGuard, safeJson } from "@/lib/api";

const requestSchema = z.object({
  html: z.string().min(10).max(500_000),
  filename: z.string().max(200).optional().default("career-analysis-report.pdf"),
});

export async function POST(request: Request) {
  const denied = apiGuard(request, 20, "export-pdf");
  if (denied) return denied;

  try {
    const { html, filename } = requestSchema.parse(await safeJson(request));

    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
      });

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json({ error: "Failed to generate PDF document." }, { status: 500 });
  }
}
