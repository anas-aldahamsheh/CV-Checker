"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Briefcase,
  Check,
  CheckCircle2,
  Clipboard,
  Clock,
  Download,
  FileCheck,
  FileText,
  RotateCcw,
  Sparkles,
  UserCheck,
  XCircle
} from "lucide-react";
import type { AnalysisResult, Priority, ResumeEvidence } from "@/ats/contracts/analysis";
import { ATS_WEIGHTS, RESUME_HEALTH_WEIGHTS } from "@/ats/scoring/score";

type Locale = "ar" | "en";
type Tab = "overview" | "ats" | "match" | "improvements" | "generate";

const tabLabels: Record<Locale, Record<Tab, string>> = {
  en: { overview: "Overview", ats: "ATS", match: "Job Match", improvements: "Recommendations", generate: "AI Cover Letter" },
  ar: { overview: "نظرة عامة شاملة", ats: "تفصيل ATS", match: "المطابقة الوظيفية", improvements: "التوصيات الدقيقة", generate: "خطاب التقديم الذكي" }
};

const componentLabels: Record<string, string> = {
  parseability: "Parseability",
  contact: "Contact completeness",
  sections: "Section structure",
  roleAlignment: "Role alignment",
  hardSkills: "Hard skills",
  experience: "Experience duration",
  keywords: "Keywords coverage",
  achievements: "Achievement & metrics quality",
  educationCertification: "Education / certification"
};

const arabicComponentLabels: Record<string, string> = {
  parseability: "قابلية القراءة الآلية",
  contact: "اكتمال بيانات التواصل",
  sections: "هيكل الأقسام القياسية",
  roleAlignment: "ملاءمة المسمى والدور",
  hardSkills: "المهارات الأساسية",
  experience: "سنوات وفترات الخبرة",
  keywords: "الكلمات المفتاحية",
  achievements: "جودة الإنجازات والنتائج الرقمية",
  educationCertification: "التعليم والشهادات"
};

function componentLabel(key: string, locale: Locale) {
  return (locale === "ar" ? arabicComponentLabels : componentLabels)[key] ?? key;
}

function scoreTone(score: number) {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function statusTone(status: string) {
  if (status === "supported") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-200";
  if (status === "partial") return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-200";
  return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border-red-200";
}

function strengthBadge(strength: string | undefined, locale: Locale) {
  const isAr = locale === "ar";
  if (strength === "strong") {
    return <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">{isAr ? "دليل قوي (إنجاز عملي)" : "Strong Evidence"}</span>;
  }
  if (strength === "moderate") {
    return <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">{isAr ? "دليل متوسط (ضمن المهام)" : "Moderate"}</span>;
  }
  if (strength === "weak") {
    return <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">{isAr ? "دليل ضعيف (غير مباشر)" : "Weak"}</span>;
  }
  if (strength === "keyword_only") {
    return <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-900/60 dark:text-purple-200">{isAr ? "في قائمة المهارات فقط" : "Keyword Only"}</span>;
  }
  return <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">{isAr ? "غير مدعوم" : "No Evidence"}</span>;
}

function priorityTone(priority: Priority) {
  if (priority === "high") return "border-red-500 bg-red-50/40 dark:bg-red-950/20";
  if (priority === "medium") return "border-amber-500 bg-amber-50/40 dark:bg-amber-950/20";
  return "border-blue-500 bg-slate-50/50 dark:bg-slate-900/30";
}

function statusLabel(status: string, locale: Locale) {
  if (locale === "en") return status.replace("_", " ");
  return status === "supported" ? "مدعوم بالكامل" : status === "partial" ? "مدعوم جزئياً" : "غير موجود";
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  return (
    <div className="relative h-28 w-28 shrink-0" role="img" aria-label={`${label}: ${score} out of 100`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-700" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className={scoreTone(score)} strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">{score}</span>
    </div>
  );
}

function generateReportHtml(result: AnalysisResult, locale: Locale) {
  const isArabic = locale === "ar";
  const isResumeOnly = result.mode === "resume-only";
  const weights = isResumeOnly ? RESUME_HEALTH_WEIGHTS : ATS_WEIGHTS;
  const dir = isArabic ? "rtl" : "ltr";
  const lang = isArabic ? "ar" : "en";
  const title = isArabic
    ? (isResumeOnly ? "تقرير جاهزية وصحة السيرة الذاتية (Resume Health)" : "تقرير التوافق الوظيفي وفحص ATS الشامل")
    : (isResumeOnly ? "Resume Health & Structural Report" : "ATS & Job Compatibility Report");
  const candidateName = result.resume.candidate.name ?? (isArabic ? "المرشح" : "Candidate");

  const componentRows = Object.entries(weights).map(([key, weight]) => {
    const rawValue = result.components[key as keyof typeof result.components];
    const value = typeof rawValue === "number" ? rawValue : 0;
    const points = Math.round(value * weight * 10) / 10;
    return `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${componentLabel(key, locale)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${Math.round(value * 100)}%</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${weight}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${points}/${weight}</td>
      </tr>
    `;
  }).join("");

  const recommendationsHtml = result.recommendations.map((rec) => {
    const borderColor = rec.priority === "high" ? "#ef4444" : rec.priority === "medium" ? "#f59e0b" : "#2563eb";
    const bgBadge = rec.priority === "high" ? "#fee2e2" : rec.priority === "medium" ? "#fef3c7" : "#dbeafe";
    const textBadge = rec.priority === "high" ? "#991b1b" : rec.priority === "medium" ? "#92400e" : "#1e40af";
    return `
      <div style="border-${isArabic ? "right" : "left"}: 4px solid ${borderColor}; background: #f8fafc; padding: 10px 14px; margin-bottom: 10px; border-radius: 6px;">
        <span style="background: ${bgBadge}; color: ${textBadge}; font-size: 10px; font-weight: bold; padding: 2px 7px; border-radius: 4px; text-transform: uppercase;">${rec.priority}</span>
        <h4 style="margin: 4px 0 2px 0; font-size: 13px; color: #0f172a;">${rec.title}</h4>
        <p style="margin: 0 0 4px 0; font-size: 11px; color: #475569;">${rec.reason}</p>
        <p style="margin: 0; font-size: 11px; font-weight: 600; color: #2563eb;">${rec.action}</p>
      </div>
    `;
  }).join("");

  const missingMustHavesHtml = result.jobMatchDetails?.missingMustHaves && result.jobMatchDetails.missingMustHaves.length > 0 ? `
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 10px 14px; margin-top: 14px;">
      <h4 style="margin: 0 0 6px 0; font-size: 12px; color: #991b1b;">${isArabic ? "متطلبات وظيفية إلزامية مفقودة (Missing Must-Haves):" : "Critical Missing Job Requirements:"}</h4>
      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        ${result.jobMatchDetails.missingMustHaves.map((m) => `<span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${m}</span>`).join("")}
      </div>
    </div>
  ` : "";

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <title>career-analysis-report-${candidateName.replace(/\s+/g, "_")}.pdf</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Arabic', Arial, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 0;
      line-height: 1.4;
      font-size: 12px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 12px;">
    <div>
      <h1 style="margin: 0; font-size: 18px; color: #2563eb;">AI Career Assistant</h1>
      <h2 style="margin: 2px 0 0 0; font-size: 13px; font-weight: normal; color: #475569;">${title}</h2>
    </div>
    <div style="text-align: ${isArabic ? "left" : "right"}; font-size: 11px; color: #64748b;">
      <p style="margin: 0;"><strong>${isArabic ? "المرشح:" : "Candidate:"}</strong> ${candidateName}</p>
      <p style="margin: 2px 0 0 0;"><strong>${isArabic ? "التاريخ:" : "Date:"}</strong> ${new Date().toLocaleDateString(isArabic ? "ar-EG" : "en-US")}</p>
      ${result.job?.jobTitle ? `<p style="margin: 2px 0 0 0;"><strong>${isArabic ? "الوظيفة:" : "Role:"}</strong> ${result.job.jobTitle}</p>` : ""}
    </div>
  </div>

  <div style="display: flex; gap: 12px; margin-bottom: 16px;">
    <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center; background: #f8fafc;">
      <div style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">
        ${isArabic ? "صحة وتنسيق السيرة الذاتية (Resume Health)" : "Resume Structural Health"}
      </div>
      <div style="font-size: 26px; font-weight: bold; color: ${result.resumeQuality >= 75 ? "#059669" : result.resumeQuality >= 50 ? "#d97706" : "#dc2626"}; margin-top: 2px;">
        ${result.resumeQuality}<span style="font-size: 14px; color: #94a3b8;">/100</span>
      </div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
        ${result.healthDetails?.wordCount ?? 0} ${isArabic ? "كلمة" : "words"} · ${result.healthDetails?.estimatedPages ?? 1} ${isArabic ? "صفحة تقريباً" : "pages"}
      </div>
    </div>
    ${!isResumeOnly && typeof result.jobMatchScore === "number" ? `
      <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center; background: #f8fafc;">
        <div style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">
          ${isArabic ? "درجة التوافق مع الوظيفة بالذكاء الاصطناعي" : "AI Job Compatibility"}
        </div>
        <div style="font-size: 26px; font-weight: bold; color: #2563eb; margin-top: 2px;">
          ${result.jobMatchScore}<span style="font-size: 14px; color: #94a3b8;">%</span>
        </div>
        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
          ${isArabic ? "المهارات الإلزامية:" : "Must-haves:"} ${result.jobMatchDetails?.mustHaveCoverage ?? 0}% · ${isArabic ? "المهارات الإضافية:" : "Preferred:"} ${result.jobMatchDetails?.niceToHaveCoverage ?? 0}%
        </div>
      </div>
    ` : ""}
  </div>

  ${missingMustHavesHtml}

  <h3 style="font-size: 13px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-top: 14px;">
    ${isArabic ? "تفصيل المعايير والأوزان" : "Score Breakdown"}
  </h3>
  <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px;">
    <thead>
      <tr style="background: #f1f5f9; color: #334155; text-align: ${isArabic ? "right" : "left"};">
        <th style="padding: 6px 10px;">${isArabic ? "المعيار" : "Category"}</th>
        <th style="padding: 6px 10px; text-align: center;">${isArabic ? "النتيجة" : "Signal"}</th>
        <th style="padding: 6px 10px; text-align: center;">${isArabic ? "الوزن" : "Weight"}</th>
        <th style="padding: 6px 10px; text-align: center;">${isArabic ? "النقاط" : "Points"}</th>
      </tr>
    </thead>
    <tbody>${componentRows}</tbody>
  </table>

  ${result.recommendations.length > 0 ? `
    <h3 style="margin-top: 16px; font-size: 13px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">
      ${isArabic ? "أهم التوصيات الدقيقة المخصصة" : "Targeted Actionable Recommendations"}
    </h3>
    <div style="margin-top: 8px;">${recommendationsHtml}</div>
  ` : ""}

  <div style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 10px; color: #94a3b8; text-align: center;">
    ${isArabic
      ? "تم إنشاء هذا التقرير بدقة بواسطة AI Career Assistant استناداً إلى الحقائق الموثقة والأدلة الحتمية."
      : "This report was generated by AI Career Assistant based on verified facts and deterministic checks."}
  </div>
</body>
</html>`;
}

function printPdfReport(result: AnalysisResult, locale: Locale) {
  if (typeof window === "undefined") return;
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "800px";
  iframe.style.height = "1000px";
  iframe.style.border = "0";
  iframe.style.opacity = "0.01";
  iframe.style.pointerEvents = "none";
  iframe.style.zIndex = "-9999";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(generateReportHtml(result, locale));
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      if (typeof iframe.contentWindow?.print === "function") {
        iframe.contentWindow.print();
      }
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 300);
}

function ScoreHeader({
  locale,
  result,
  onDownload,
  isExporting
}: {
  locale: Locale;
  result: AnalysisResult;
  onDownload: () => void;
  isExporting?: boolean;
}) {
  const arabic = locale === "ar";
  const primaryScore = result.score ?? result.resumeQuality;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-5">
            <ScoreRing
              score={primaryScore}
              label={result.mode === "job-match" ? (arabic ? "درجة توافق ATS" : "ATS Compatibility Score") : (arabic ? "جاهزية وصحة السيرة" : "Resume Health")}
            />
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {result.mode === "job-match"
                  ? (arabic ? "درجة التوافق الكلية مع الوظيفة" : "Overall ATS Job Compatibility")
                  : (arabic ? "صحة وتنسيق السيرة الذاتية (Resume Health)" : "Resume Structural Health")}
              </p>
              <p className={`mt-1 text-2xl font-bold ${scoreTone(primaryScore)}`}>
                {primaryScore}<span className="text-base font-normal text-slate-400">/100</span>
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {arabic ? "الثقة التحليلية" : "Confidence"}: {result.confidence}% · {arabic ? "قراءة الملف" : "Parsing"}: {result.parse.status}
              </p>
              {result.job && (
                <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                  {arabic ? "الوظيفة المستهدفة:" : "Target role:"} <span dir="auto" className="font-semibold text-blue-600 dark:text-blue-400">{result.job.jobTitle || "—"}</span>
                </p>
              )}
            </div>
          </div>

          {result.mode === "job-match" && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{arabic ? "صحة السيرة الذاتية الذاتية" : "Intrinsic Resume Health"}</p>
              <p className={`mt-1 text-xl font-bold ${scoreTone(result.resumeQuality)}`}>
                {result.resumeQuality}<span className="text-sm font-normal text-slate-400">/100</span>
              </p>
              {typeof result.jobMatchScore === "number" && (
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {arabic ? `ملاءمة متطلبات الوظيفة: ${result.jobMatchScore}%` : `Job match: ${result.jobMatchScore}%`}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:self-start">
          <Link
            href={`/${locale}/analyze`}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors dark:bg-blue-600 dark:hover:bg-blue-500"
            title={arabic ? "فحص سيرة ذاتية أخرى" : "Check another CV"}
          >
            <RotateCcw className="h-4 w-4" />
            {arabic ? "فحص سيرة ذاتية أخرى" : "Check another CV"}
          </Link>

          <button
            type="button"
            onClick={onDownload}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className={`h-4 w-4 ${isExporting ? "animate-bounce text-blue-600" : ""}`} />
            {isExporting ? (arabic ? "جارٍ تجهيز PDF…" : "Generating PDF…") : (arabic ? "تنزيل تقرير PDF" : "Download PDF report")}
          </button>
        </div>
      </div>

      {result.parse.warnings.length > 0 && (
        <div className="mt-4 rounded-md bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {result.parse.warnings.join(" ")}
        </div>
      )}
    </section>
  );
}

function Overview({ locale, result }: { locale: Locale; result: AnalysisResult }) {
  const isAr = locale === "ar";
  const contact = result.healthDetails?.contact;
  const gaps = result.healthDetails?.timelineGaps ?? [];
  const ghostSkills = result.healthDetails?.ghostSkills ?? [];
  const jobMatch = result.jobMatchDetails;

  return (
    <div className="space-y-8">
      {/* SECTION 1: Resume Structural Health */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
          <FileCheck className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {isAr ? "القسم الأول: فحص صحة وتنسيق السيرة الذاتية (Resume Health)" : "Module 1: Resume Structural Health & Completeness"}
          </h2>
          <span className="ms-auto rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            {result.resumeQuality}/100
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Contact Details */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">{isAr ? "معلومات التواصل" : "Contact Details"}</span>
              {contact && contact.missingFields.length === 0 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              )}
            </div>
            <p className="mt-2 text-2xl font-bold">{Math.round((contact?.score ?? result.components.contact) * 100)}%</p>
            {contact && contact.missingFields.length > 0 ? (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-red-600 dark:text-red-400">{isAr ? "حقول مفقودة:" : "Missing fields:"}</p>
                <div className="flex flex-wrap gap-1">
                  {(isAr ? contact.arabicMissingFields : contact.missingFields).map((field) => (
                    <span key={field} className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-200">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                {isAr ? "جميع بيانات الاتصال الأساسية مكتملة." : "All primary contact fields present."}
              </p>
            )}
            {contact && contact.unverifiedFields && contact.unverifiedFields.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">{isAr ? "روابط بحاجة للتفعيل:" : "Hyperlinks to verify:"}</p>
                <div className="flex flex-wrap gap-1">
                  {(isAr ? contact.arabicUnverifiedFields ?? contact.unverifiedFields : contact.unverifiedFields).map((field) => (
                    <span key={field} className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Timeline & Gaps */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">{isAr ? "المسار الزمني والفجوات" : "Timeline & Order"}</span>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-lg font-bold">
              {result.healthDetails?.isChronological ? (
                <span className="text-emerald-600 dark:text-emerald-400">{isAr ? "ترتيب زمني سليم (الأحدث أولاً)" : "Reverse Chronological"}</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">{isAr ? "تنبيه: الترتيب غير متناسق" : "Needs Reordering"}</span>
              )}
            </p>
            {gaps.length > 0 ? (
              <div className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                <strong>{isAr ? "فجوة زمنية:" : "Gap:"}</strong> {gaps[0].months} {isAr ? "شهراً بين" : "months between"} {gaps[0].start} - {gaps[0].end}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">{isAr ? "لا توجد فجوات انقطاع بارزة تفوق 6 أشهر." : "No significant employment gaps (>6 mos)."}</p>
            )}
          </div>

          {/* Card 3: Skills & Evidence */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">{isAr ? "المهارات والأدلة" : "Skills Evidence"}</span>
              <Sparkles className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-bold">{result.resume.skills.length} <span className="text-sm font-normal text-slate-400">{isAr ? "مهارة مستخرجة" : "skills"}</span></p>
            {ghostSkills.length > 0 ? (
              <div className="mt-2">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  {isAr ? `${ghostSkills.length} مهارات بلا دليل عملي في الخبرات:` : `${ghostSkills.length} skills with no role evidence:`}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {ghostSkills.slice(0, 3).map((s) => (
                    <span key={s} className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                      {s}
                    </span>
                  ))}
                  {ghostSkills.length > 3 && <span className="text-xs text-slate-500">+{ghostSkills.length - 3}</span>}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{isAr ? "المهارات مدعومة بسياق عملي." : "Skills grounded in experience."}</p>
            )}
          </div>

          {/* Card 4: Action & Metrics */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">{isAr ? "الأرقام والنتائج المحققة" : "Metrics & Results"}</span>
              <FileText className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-bold">{result.healthDetails?.metricsCount ?? 0} <span className="text-sm font-normal text-slate-400">{isAr ? "نتائج رقمية" : "metrics cited"}</span></p>
            <p className="mt-2 text-xs text-slate-500">
              {(result.healthDetails?.achievementDetails?.strongCount ?? 0) + (result.healthDetails?.achievementDetails?.moderateCount ?? 0) > 0
                ? (isAr
                    ? `${(result.healthDetails?.achievementDetails?.strongCount ?? 0) + (result.healthDetails?.achievementDetails?.moderateCount ?? 0)} إنجازات وتأثيرات نوعية محققة.`
                    : `${(result.healthDetails?.achievementDetails?.strongCount ?? 0) + (result.healthDetails?.achievementDetails?.moderateCount ?? 0)} verified impact achievements detected.`)
                : (isAr
                    ? `${result.healthDetails?.strongActionBulletsCount ?? 0} من أصل ${result.healthDetails?.totalBulletsCount ?? 0} نقطة تبدأ بأفعال قوية.`
                    : `${result.healthDetails?.strongActionBulletsCount ?? 0} of ${result.healthDetails?.totalBulletsCount ?? 0} bullets use strong action verbs.`)}
            </p>
            {result.healthDetails?.achievementDetails?.explanation && (
              <p className="mt-1 text-xs text-slate-400 line-clamp-1" title={result.healthDetails.achievementDetails.explanation}>
                {result.healthDetails.achievementDetails.explanation}
              </p>
            )}
          </div>

          {/* Card 5: Text Length & Density */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">{isAr ? "طول وكثافة النص" : "Length & Density"}</span>
              <FileCheck className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-bold">{result.healthDetails?.wordCount ?? 0} <span className="text-sm font-normal text-slate-400">{isAr ? "كلمة" : "words"}</span></p>
            <p className="mt-2 text-xs text-slate-500">
              {isAr
                ? `الحجم التقديري: حوالي ${result.healthDetails?.estimatedPages ?? 1} صفحة (المثالي 1 إلى 2 صفحة).`
                : `Estimated length: ~${result.healthDetails?.estimatedPages ?? 1} page(s). Ideal for ATS.`}
            </p>
          </div>

          {/* Card 6: Parseability Status */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">{isAr ? "قابلية القراءة الآلية" : "ATS Parseability"}</span>
              <UserCheck className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-bold">{Math.round(result.components.parseability * 100)}%</p>
            <p className="mt-2 text-xs text-slate-500">
              {result.parse.status === "good" ? (isAr ? "الملف نصي وقابل للقراءة بسلاسة." : "Text structure is fully accessible.") : (isAr ? "هناك رموز أو كتل قد تعيق القراءة." : "Formatting noise detected.")}
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: AI Job Compatibility */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
          <Briefcase className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {isAr ? "القسم الثاني: التوافق مع الوظيفة بالذكاء الاصطناعي (Job Compatibility)" : "Module 2: AI Job Fit & Gap Analysis"}
          </h2>
          {result.mode === "job-match" && typeof result.jobMatchScore === "number" && (
            <span className="ms-auto rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-200">
              {result.jobMatchScore}%
            </span>
          )}
        </div>

        {result.mode === "job-match" && jobMatch ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-semibold uppercase text-slate-500">{isAr ? "المهارات الإلزامية (Must-Haves)" : "Must-Have Skills"}</span>
                <p className={`mt-2 text-2xl font-bold ${scoreTone(jobMatch.mustHaveCoverage)}`}>{jobMatch.mustHaveCoverage}%</p>
                <p className="mt-1 text-xs text-slate-500">{isAr ? "نسبة تغطية المهارات الأساسية المطلوبة للوظيفة." : "Coverage of critical requirements."}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-semibold uppercase text-slate-500">{isAr ? "المهارات الإضافية (Nice-To-Haves)" : "Preferred Skills"}</span>
                <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{jobMatch.niceToHaveCoverage}%</p>
                <p className="mt-1 text-xs text-slate-500">{isAr ? "نسبة تغطية المهارات التفضيلية الإضافية." : "Coverage of preferred skills."}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-semibold uppercase text-slate-500">{isAr ? "مستوى الأقدمية والمسمى" : "Seniority Alignment"}</span>
                <p className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-200">
                  {jobMatch.seniorityMatch.status === "matched"
                    ? (isAr ? "متطابق مع المطلوب" : "Matched")
                    : jobMatch.seniorityMatch.status === "underqualified"
                    ? (isAr ? "يتطلب أقدمية أعلى" : "Underqualified")
                    : jobMatch.seniorityMatch.status === "overqualified"
                    ? (isAr ? "أقدمية تفوق المطلوب" : "Overqualified")
                    : (isAr ? "مناسب" : "Compatible")}
                </p>
                <p className="mt-1 text-xs text-slate-500">{jobMatch.seniorityMatch.reason}</p>
              </div>
            </div>

            {/* Missing Must-Haves Banner */}
            {jobMatch.missingMustHaves.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 dark:border-red-900/50 dark:bg-red-950/30">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
                  <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                  <h3 className="text-sm font-bold">{isAr ? "مهارات ومتطلبات إلزامية مفقودة في سيرتك الذاتية:" : "Missing Must-Have Requirements:"}</h3>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {jobMatch.missingMustHaves.map((m) => (
                    <span key={m} className="rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-bold text-red-700 shadow-sm dark:border-red-800 dark:bg-slate-900 dark:text-red-300">
                      {m}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-red-700 dark:text-red-300">
                  {isAr
                    ? "نصيحة: عدم وجود هذه المتطلبات قد يعرض طلبك للاستبعاد التلقائي من أنظمة الفلترة إذا كانت لديك الخبرة بها فاحرص على ذكرها بصراحة."
                    : "Tip: Missing critical must-haves may lead to automated ATS filtering. If you possess this experience, explicitly add it."}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-950">
            <Sparkles className="mx-auto h-8 w-8 text-blue-500" />
            <h3 className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-200">
              {isAr ? "المطابقة الوظيفية غير مفعلة" : "Job Match Inactive"}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
              {isAr
                ? "قمت بتحليل السيرة الذاتية وحدها دون إرفاق وصف وظيفي. لم يتم خصم أي نقاط، وبقيت درجة صحة السيرة نقية ومستقلة. لتفعيل مقارنة المهارات واستخراج الفجوات، الصق الوصف الوظيفي في خطوة التحليل."
                : "You analyzed your resume without pasting a target job description. Resume Health is evaluated independently without penalties. To enable gap analysis and job match scoring, paste a job description."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function AtsBreakdown({ locale, result }: { locale: Locale; result: AnalysisResult }) {
  const arabic = locale === "ar";
  const isResumeOnly = result.mode === "resume-only";
  const weights = isResumeOnly ? RESUME_HEALTH_WEIGHTS : ATS_WEIGHTS;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-bold">
        {isResumeOnly
          ? (arabic ? "تفصيل معايير صحة وهيكل السيرة الذاتية" : "Resume Health & Structure Breakdown")
          : (arabic ? "تفصيل درجات ATS الحتمية" : "Deterministic ATS Score Breakdown")}
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {isResumeOnly
          ? (arabic ? "محسوبة بدقة من معايير السيرة الذاتية الذاتية دون أي افتراضات أو خصم لمتطلبات وظيفية غائبة." : "Calculated purely from intrinsic resume criteria without penalizing for missing job requirements.")
          : (arabic ? "كل فئة محسوبة من إشارات متحققة وأوزان رياضية ثابتة بدون تخمين." : "Every category is calculated from validated signals and explicit mathematical weights.")}
      </p>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 text-left dark:border-slate-700">
            <tr>
              <th className="p-2.5 font-semibold text-slate-700 dark:text-slate-300">{arabic ? "الفئة" : "Category"}</th>
              <th className="p-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">{arabic ? "النتيجة" : "Signal"}</th>
              <th className="p-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">{arabic ? "الوزن" : "Weight"}</th>
              <th className="p-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">{arabic ? "النقاط" : "Points"}</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(weights).map(([key, weight]) => {
              const rawValue = result.components[key as keyof typeof result.components];
              const value = typeof rawValue === "number" ? rawValue : 0;
              const points = Math.round(value * weight * 10) / 10;
              return (
                <tr key={key} className="border-b border-slate-100 dark:border-slate-800/80">
                  <td className="p-2.5 font-medium">{componentLabel(key, locale)}</td>
                  <td className="p-2.5 text-center">{Math.round(value * 100)}%</td>
                  <td className="p-2.5 text-center text-slate-500">{weight}</td>
                  <td className="p-2.5 text-center font-bold text-slate-900 dark:text-slate-100">{points}/{weight}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {result.components.educationCertification !== null && (
        <p className="mt-4 text-xs text-slate-500">
          {arabic
            ? `مطابقة التعليم/الشهادات: ${Math.round(result.components.educationCertification * 100)}% (تُعرض عند توفر متطلبات تعليمية محددة).`
            : `Education/certification match: ${Math.round(result.components.educationCertification * 100)}% (shown when required; does not alter base health weights).`}
        </p>
      )}
    </section>
  );
}

function MatchTable({ locale, result }: { locale: Locale; result: AnalysisResult }) {
  const arabic = locale === "ar";
  if (!result.requirements.length) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Sparkles className="mx-auto h-8 w-8 text-blue-500" />
        <h3 className="mt-3 text-base font-semibold">{arabic ? "المطابقة الوظيفية غير مفعلة" : "Job Matching Inactive"}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
          {arabic
            ? "لم يتم إدخال وصف وظيفي لمطابقته. لمقارنة متطلبات وظيفة معينة مع مهاراتك بالذكاء الاصطناعي، يرجى لصق الوصف الوظيفي في خطوة التحليل."
            : "No job description was provided. To activate AI-powered requirement matching and gap analysis, paste a job description on the upload page."}
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="min-w-full text-start text-sm">
        <thead className="bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
          <tr>
            <th className="p-3.5 text-start">{arabic ? "المتطلب الوظيفي" : "Job Requirement"}</th>
            <th className="p-3.5 text-center">{arabic ? "الأهمية" : "Importance"}</th>
            <th className="p-3.5 text-center">{arabic ? "الحالة" : "Status"}</th>
            <th className="p-3.5 text-center">{arabic ? "قوة الدليل" : "Evidence Strength"}</th>
            <th className="p-3.5 text-start">{arabic ? "الدليل المستخرج من سيرتك" : "Evidence"}</th>
          </tr>
        </thead>
        <tbody>
          {result.requirements.map((requirement) => {
            const match = result.matches.find((item) => item.requirementId === requirement.id);
            const evidence = match?.evidenceIds
              .map((id) => result.resume.evidenceItems.find((item) => item.id === id)?.text)
              .filter(Boolean);

            const isRequired = requirement.importance === "required";

            return (
              <tr key={requirement.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="p-3.5 font-medium" dir="auto">
                  {requirement.name}
                </td>
                <td className="p-3.5 text-center">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${isRequired ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
                    {isRequired ? (arabic ? "إلزامي (Must-have)" : "Required") : (arabic ? "مفضل (Nice-to-have)" : "Preferred")}
                  </span>
                </td>
                <td className="p-3.5 text-center">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusTone(match?.status ?? "not_found")}`}>
                    {statusLabel(match?.status ?? "not_found", locale)}
                  </span>
                </td>
                <td className="p-3.5 text-center">
                  {strengthBadge(match?.evidenceStrength, locale)}
                </td>
                <td className="p-3.5 text-xs text-slate-600 dark:text-slate-300">
                  {evidence?.length ? (
                    <div className="space-y-1">
                      {evidence.map((item) => (
                        <div key={item} dir="auto" className="rounded bg-slate-100 p-1.5 dark:bg-slate-800">
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function Improvements({ result }: { result: AnalysisResult }) {
  return (
    <section className="space-y-4">
      {result.recommendations.map((item) => (
        <article
          key={item.title}
          className={`rounded-xl border-l-4 p-5 shadow-sm dark:bg-slate-900 ${priorityTone(item.priority)}`}
        >
          <div className="flex items-center gap-2">
            <span className="rounded bg-white px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-200">
              {item.priority}
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.reason}</p>
          <div className="mt-3 rounded-md bg-white/80 p-3 text-xs font-semibold text-blue-700 shadow-sm dark:bg-slate-800/80 dark:text-blue-300">
            {item.action}
          </div>
        </article>
      ))}
    </section>
  );
}

function generateCoverLetterHtml(
  text: string,
  candidate: ResumeEvidence["candidate"],
  locale: Locale
) {
  const isArabic = locale === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const lang = isArabic ? "ar" : "en";
  const candidateName = candidate.name ?? (isArabic ? "المرشح" : "Candidate");
  const contactParts = [
    candidate.email,
    candidate.phone,
    candidate.location,
    ...(candidate.links || []).slice(0, 2)
  ].filter(Boolean);

  const formattedDate = new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date());

  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const paragraphs = escaped
    .split(/\n\n+/)
    .map((p) => `<p style="margin: 0 0 16px 0; line-height: 1.7; text-align: justify;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8"/>
  <title>${isArabic ? "خطاب تقديم" : "Cover Letter"} - ${candidateName}</title>
  <style>
    @page { size: A4; margin: 25mm 20mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Arabic', 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11pt;
      line-height: 1.6;
    }
    .header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 14px;
      margin-bottom: 24px;
    }
    .name {
      font-size: 20pt;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .contacts {
      font-size: 9.5pt;
      color: #64748b;
      margin: 0;
    }
    .date {
      font-size: 10pt;
      color: #475569;
      margin-bottom: 20px;
    }
    .content {
      color: #1e293b;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${candidateName}</div>
    <div class="contacts">${contactParts.join(" · ")}</div>
  </div>
  <div class="date">${formattedDate}</div>
  <div class="content">
    ${paragraphs}
  </div>
</body>
</html>`;
}

function printCoverLetterHtml(html: string) {
  if (typeof window === "undefined") return;
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "800px";
  iframe.style.height = "1000px";
  iframe.style.border = "0";
  iframe.style.opacity = "0.01";
  iframe.style.pointerEvents = "none";
  iframe.style.zIndex = "-9999";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      if (typeof iframe.contentWindow?.print === "function") {
        iframe.contentWindow.print();
      }
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 300);
}

function GeneratorPanel({ locale, result }: { locale: Locale; result: AnalysisResult }) {
  const arabic = locale === "ar";
  const [coverLetter, setCoverLetter] = useState("");
  const [generationType, setGenerationType] = useState<"job-tailored" | "general" | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [generatorError, setGeneratorError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const hasJob = Boolean(result.job && result.job.jobTitle);

  async function handleGenerate(mode: "job-tailored" | "general") {
    setIsGenerating(true);
    setGeneratorError("");
    setCopyStatus("");
    setGenerationType(mode);

    try {
      const response = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: result.resume,
          job: mode === "job-tailored" ? result.job : null,
          locale,
          tone: "professional"
        })
      });
      const data = (await response.json()) as { text?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Generation failed.");
      if (!data.text) throw new Error("Generation returned no content.");
      setCoverLetter(data.text);
    } catch {
      setGeneratorError(
        arabic
          ? "تعذر توليد خطاب التقديم. يرجى المحاولة مرة أخرى."
          : "Cover letter could not be generated. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyCoverLetter() {
    if (!coverLetter.trim()) return;
    try {
      await navigator.clipboard.writeText(coverLetter);
      setCopyStatus(arabic ? "تم نسخ الخطاب بنجاح!" : "Cover letter copied successfully!");
      setTimeout(() => setCopyStatus(""), 3000);
    } catch {
      setCopyStatus(arabic ? "تعذر النسخ تلقائياً. انسخ النص يدوياً." : "Copy failed. Please copy manually.");
    }
  }

  async function downloadCoverLetterPdf() {
    if (!coverLetter.trim()) return;
    setIsExportingPdf(true);
    const candidateName = result.resume.candidate.name ?? (arabic ? "المرشح" : "Candidate");
    const safeName = candidateName.replace(/[^\w\u0600-\u06FF\s-]/g, "").trim().replace(/\s+/g, "_") || "Candidate";
    const filename = `cover-letter-${safeName}.pdf`;
    const html = generateCoverLetterHtml(coverLetter, result.resume.candidate, locale);

    try {
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, filename })
      });

      if (!res.ok) throw new Error("Server PDF export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      printCoverLetterHtml(html);
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <section className="space-y-6">
      {/* Header Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2.5">
          <Sparkles aria-hidden="true" className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {arabic ? "توليد خطاب التقديم الذكي (AI Cover Letter)" : "Smart AI Cover Letter Generator"}
          </h2>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {arabic
            ? "أنشئ خطاب تقديم احترافي مبني بدقة على خبراتك وإنجازاتك الحقيقية الموثقة في سيرتك الذاتية دون أي اختلاق."
            : "Generate a professional cover letter grounded in your verified resume achievements without hallucinated facts."}
        </p>

        {/* The Two Main Action Buttons */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Button 1: Job-Tailored Cover Letter */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/60">
            <div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {arabic ? "خطاب مخصص للوظيفة المستهدفة" : "Job-Tailored Cover Letter"}
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {arabic
                  ? "يربط إنجازاتك وخبراتك بمتطلبات الوظيفة المستهدفة ويوضح مدى ملاءمتك للدور المطلوب."
                  : "Connects your verified achievements directly to the target role's key requirements."}
              </p>
              {hasJob && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  <span>{arabic ? "الوظيفة المستهدفة:" : "Target:"}</span>
                  <span className="font-bold">{result.job?.jobTitle}</span>
                </div>
              )}
            </div>

            <div className="mt-4">
              <button
                type="button"
                disabled={!hasJob || isGenerating}
                onClick={() => handleGenerate("job-tailored")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
              >
                <Briefcase className="h-4 w-4" />
                <span>
                  {isGenerating && generationType === "job-tailored"
                    ? (arabic ? "جارٍ التوليد…" : "Generating…")
                    : (arabic ? "توليد خطاب مخصص للوظيفة" : "Generate Job Cover Letter")}
                </span>
              </button>

              {!hasJob && (
                <p className="mt-2 flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {arabic
                      ? "غير متاح: يلزم إدخال وصف الوظيفة المستهدفة لتوليد خطاب مخصص لها."
                      : "Unavailable: A target job description is required for this option."}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Button 2: General Resume-Based Cover Letter */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/60">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {arabic ? "خطاب تعريفي عام (حسب السيرة الذاتية)" : "General Cover Letter (Resume-Based)"}
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {arabic
                  ? "يبرز نقاط قوتك الشاملة وأهم إنجازاتك من السيرة الذاتية لتقديمه لمختلف الفرص المناسبة."
                  : "Highlights your overarching strengths and proven achievements for open career opportunities."}
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <span>{arabic ? "مبني على السيرة الذاتية بشكل عام" : "Based on your resume alone"}</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => handleGenerate("general")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {isGenerating && generationType === "general"
                    ? (arabic ? "جارٍ التوليد…" : "Generating…")
                    : (arabic ? "توليد خطاب عام من الـ CV" : "Generate General Cover Letter")}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress & Error indicators */}
        {isGenerating && (
          <div className="mt-5 flex items-center gap-2.5 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>
              {arabic
                ? "جارٍ صياغة خطاب التقديم بالذكاء الاصطناعي وربطه بإنجازاتك الموثقة بدقة…"
                : "Generating your cover letter grounded strictly in your verified achievements…"}
            </span>
          </div>
        )}

        {generatorError && (
          <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
            {generatorError}
          </p>
        )}
      </div>

      {/* Result Card: View, Edit, Copy, Download PDF */}
      {coverLetter && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                <Check className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  {arabic ? "خطاب التقديم المُنشأ" : "Generated Cover Letter"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {arabic
                    ? "يمكنك تعديل أي جملة أو إضافة أي ملاحظات مباشرة في المربع أدناه"
                    : "You can edit the text directly in the box below before copying or downloading"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={copyCoverLetter}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Clipboard className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>{arabic ? "نسخ النص" : "Copy"}</span>
              </button>

              <button
                type="button"
                disabled={isExportingPdf}
                onClick={downloadCoverLetterPdf}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <Download className={`h-3.5 w-3.5 ${isExportingPdf ? "animate-bounce" : ""}`} />
                <span>
                  {isExportingPdf
                    ? (arabic ? "جارٍ التنزيل…" : "Exporting…")
                    : (arabic ? "تنزيل PDF" : "Download PDF")}
                </span>
              </button>
            </div>
          </div>

          {copyStatus && (
            <div className="mt-3 rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              {copyStatus}
            </div>
          )}

          {/* Editable Text Area */}
          <div className="mt-4">
            <textarea
              dir="auto"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={16}
              className="block w-full resize-y rounded-lg border border-slate-200 bg-slate-50/50 p-4 font-sans text-sm leading-relaxed text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200 dark:focus:bg-slate-900"
              placeholder={arabic ? "نص خطاب التقديم..." : "Cover letter text..."}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {arabic
                ? `عدد الكلمات: ${coverLetter.trim().split(/\s+/).filter(Boolean).length} كلمة · ${coverLetter.length} حرفاً`
                : `${coverLetter.trim().split(/\s+/).filter(Boolean).length} words · ${coverLetter.length} characters`}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {arabic ? "جاهز للتعديل والتقديم" : "Ready to edit & share"}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

export function ResultsDashboard({ locale, result }: { locale: Locale; result: AnalysisResult }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [isExporting, setIsExporting] = useState(false);

  async function download() {
    setIsExporting(true);
    try {
      const candidateName = result.resume.candidate.name ?? (locale === "ar" ? "المرشح" : "Candidate");
      const safeName = candidateName.replace(/[^\w\u0600-\u06FF\s-]/g, "").trim().replace(/\s+/g, "_") || "Candidate";
      const filename = `career-analysis-report-${safeName}.pdf`;
      const html = generateReportHtml(result, locale);

      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, filename })
      });

      if (!res.ok) throw new Error("Server PDF export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      printPdfReport(result, locale);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <ScoreHeader locale={locale} result={result} onDownload={download} isExporting={isExporting} />
      <div role="tablist" aria-label={locale === "ar" ? "أقسام النتائج" : "Result sections"} className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        {(Object.keys(tabLabels[locale]) as Tab[]).map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
            className={`rounded-md px-3.5 py-2 text-sm font-semibold transition-colors ${
              tab === item ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {tabLabels[locale][item]}
          </button>
        ))}
      </div>
      {tab === "overview" && <Overview locale={locale} result={result} />}
      {tab === "ats" && <AtsBreakdown locale={locale} result={result} />}
      {tab === "match" && <MatchTable locale={locale} result={result} />}
      {tab === "improvements" && <Improvements result={result} />}
      {tab === "generate" && <GeneratorPanel locale={locale} result={result} />}
    </div>
  );
}
