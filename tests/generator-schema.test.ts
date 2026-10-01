import { describe, expect, it } from "vitest";
import { extractJobFallback, extractResumeFallback } from "@/ai/analysis/fallback";
import { generatorRequestSchema } from "@/features/generators/schemas";

describe("generator request contract", () => {
  it("accepts validated fallback analysis facts", () => {
    const resume = extractResumeFallback(`Taylor Example
taylor@example.com
https://linkedin.com/in/taylor
Summary
Frontend developer.
Experience
Frontend Engineer | Acme | Jan 2021 - Present
• Built accessible React and TypeScript reporting dashboards that improved reporting speed by 30%.
Skills
React, TypeScript, JavaScript
Education
Bachelor of Computer Science`);
    const job = extractJobFallback(`Senior Frontend Engineer
Required: React, TypeScript, JavaScript
Minimum 3 years of experience
Bachelor degree required
Build accessible web applications.`);
    expect(generatorRequestSchema.safeParse({ resume, job, tone: "professional" }).success).toBe(true);
  });
});
