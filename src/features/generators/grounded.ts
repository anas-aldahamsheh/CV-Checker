import type { JobRequirements, ResumeEvidence } from "@/ats/contracts/analysis";

function evidenceText(resume: ResumeEvidence) { return resume.evidenceItems.filter((item) => item.sourceSection === "experience" || item.sourceSection === "projects").slice(0, 3).map((item) => item.text); }
export function createCoverLetter(
  resume: ResumeEvidence,
  job?: JobRequirements | null,
  tone: "professional" | "concise" | "enthusiastic" = "professional",
  locale: "ar" | "en" = "en"
) {
  const facts = evidenceText(resume);
  const targetTitle = job?.jobTitle?.trim();

  if (locale === "ar") {
    const opening =
      tone === "enthusiastic"
        ? "يسعدني التقدم للمساهمة في"
        : tone === "concise"
        ? "أتقدم إلى"
        : "أتقدم بطلب لشغل";
    const targetRole = targetTitle ? `وظيفة ${targetTitle}` : "الفرص المهنية المتاحة والمتوافقة مع خبراتي";
    const body = facts.length
      ? facts.map((fact) => `• ${fact}`).join("\n")
      : "يسعدني مناقشة الخبرة والمهام الموثقة في سيرتي الذاتية بالتفصيل.";
    return `فريق التوظيف المحترم،\n\n${opening} ${targetRole}. تستند النقاط التالية مباشرة إلى سيرتي الذاتية المقدمة وخبراتي الموثقة:\n\n${body}\n\nشكراً لوقتكم واهتمامكم.\n\nمع التحية،\n${resume.candidate.name ?? ""}`.trim();
  }

  const opening =
    tone === "enthusiastic"
      ? "I am interested in the opportunity to contribute to"
      : tone === "concise"
      ? "I am applying for"
      : "I am writing to apply for";
  const targetRole = targetTitle ? `the ${targetTitle} role` : "opportunities matching my professional background";
  const body = facts.length
    ? facts.map((fact) => `• ${fact}`).join("\n")
    : "I would welcome the opportunity to discuss the experience documented in my resume.";
  return `Dear Hiring Team,\n\n${opening} ${targetRole}. The following points are drawn directly from my supplied resume:\n\n${body}\n\nThank you for your consideration.\n\nSincerely,\n${resume.candidate.name ?? ""}`.trim();
}
export function createApplicationAnswer(resume: ResumeEvidence, question: string, context?: string, locale: "ar" | "en" = "en") { const facts = evidenceText(resume); const answer = facts.length ? facts.join(" ") : locale === "ar" ? "يسعدني مناقشة الخبرة ذات الصلة الموثقة في سيرتي الذاتية." : "I would be glad to discuss the relevant experience documented in my resume."; return `${answer}${context?.trim() ? ` ${context.trim()}` : ""}`; }
export function rewriteBullet(original: string) { const normalized = original.trim().replace(/^[•*-]\s*/, ""); return normalized ? normalized.replace(/\s+/g, " ") : ""; }
export function tailorSummary(resume: ResumeEvidence, job: JobRequirements | null, locale: "ar" | "en" = "en") { const skills = resume.skills.slice(0, 6).join(", "); if (locale === "ar") return `${resume.candidate.name ?? "المرشح"}${job?.jobTitle ? ` مرشح لوظيفة ${job.jobTitle}` : ""}${skills ? ` بمهارات موثقة في ${skills}` : " بخبرة موثقة من السيرة الذاتية المقدمة"}.`; const role = job?.jobTitle ? ` for ${job.jobTitle}` : ""; return `${resume.candidate.name ?? "Candidate"}${role}${skills ? ` with documented skills in ${skills}` : " with documented experience from the supplied resume"}.`; }
