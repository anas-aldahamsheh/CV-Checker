"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, Upload, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ParsedResume } from "@/features/resume-parser/types";
import type { AnalysisResult } from "@/ats/contracts/analysis";
import { useAnalysis } from "@/features/ats-analysis/analysis-store";

type FormValues = { jdText: string };

export function ResumeFlow({ locale }: { locale: "ar" | "en" }) {
  const arabic = locale === "ar";
  const router = useRouter();
  const { setResult } = useAnalysis();
  const { register, handleSubmit } = useForm<FormValues>({ defaultValues: { jdText: "" } });

  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  async function selectFile(file: File | undefined) {
    if (!file) return;

    // Validate file type
    const validExtensions = [".pdf", ".docx", ".txt"];
    const lowerName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));
    if (!isValidExt) {
      setError(
        arabic
          ? "صيغة الملف غير مدعومة. يرجى رفع ملف بصيغة PDF أو DOCX أو TXT فقط."
          : "Unsupported file type. Please upload a PDF, DOCX, or TXT file only."
      );
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError(
        arabic
          ? "حجم الملف يتجاوز الحد المسموح (5MB). يرجى اختيار ملف أصغر حجماً."
          : "File size exceeds 5MB limit. Please choose a smaller file."
      );
      return;
    }

    setBusy(true);
    setError("");
    setParsed(null);
    setFileName(file.name);

    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/parse-resume", { method: "POST", body });
      const data = (await response.json()) as ParsedResume & { error?: string };
      if (!response.ok) throw new Error(data.error);
      setParsed(data);
    } catch {
      setError(
        arabic
          ? "تعذر قراءة الملف. ارفع PDF أو DOCX أو TXT نصياً بحجم لا يتجاوز 5MB."
          : "We could not read this file. Upload a text-based PDF, DOCX, or TXT up to 5MB."
      );
    } finally {
      setBusy(false);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }

  function handleDragEnter(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) {
      selectFile(droppedFile);
    }
  }

  async function analyze(values: FormValues) {
    if (!parsed) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: parsed.text,
          hyperlinks: parsed.hyperlinks,
          jdText: values.jdText || undefined,
          parse: parsed.parse,
          locale
        })
      });
      const data = (await response.json()) as AnalysisResult & { error?: string };
      if (!response.ok) throw new Error(data.error);
      setResult(data);
      router.push(`/${locale}/results`);
    } catch {
      setError(arabic ? "تعذر إكمال التحليل. حاول مرة أخرى." : "Analysis could not be completed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(analyze)} className="space-y-7" noValidate>
      {/* 1. Upload resume */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <Upload aria-hidden="true" className="mt-1 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold">{arabic ? "١. ارفع السيرة الذاتية" : "1. Upload your resume"}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {arabic ? "PDF أو DOCX أو TXT، حتى 5MB. لا يتم حفظ الملف." : "PDF, DOCX, or TXT up to 5MB. Your file is not stored."}
            </p>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <label
          htmlFor="resume-file"
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mt-5 block cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
            isDragging
              ? "border-blue-600 bg-blue-50/80 scale-[1.01] shadow-md dark:border-blue-400 dark:bg-blue-950/40"
              : "border-slate-300 hover:border-blue-500 hover:bg-slate-50/60 dark:border-slate-700 dark:hover:border-blue-500 dark:hover:bg-slate-800/40"
          }`}
        >
          <input
            id="resume-file"
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className="sr-only"
            onChange={(event) => selectFile(event.target.files?.[0])}
          />
          <div className="flex flex-col items-center justify-center">
            <div
              className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full transition-all ${
                isDragging
                  ? "bg-blue-100 text-blue-600 ring-4 ring-blue-200 dark:bg-blue-900/60 dark:text-blue-300 dark:ring-blue-850"
                  : fileName
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {isDragging ? (
                <UploadCloud className="h-7 w-7 animate-bounce text-blue-600 dark:text-blue-400" />
              ) : fileName ? (
                <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <UploadCloud className="h-7 w-7 text-slate-500 dark:text-slate-400" />
              )}
            </div>

            {isDragging ? (
              <p className="text-base font-semibold text-blue-600 dark:text-blue-400">
                {arabic ? "أفلت ملف السيرة الذاتية هنا" : "Drop your resume file here"}
              </p>
            ) : fileName ? (
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  {fileName}
                </p>
                <p className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                  {arabic ? "تم اختيار الملف · اضغط أو اسحب ملفاً آخر للاستبدال" : "File selected · Click or drag another file to replace"}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  {arabic ? "اسحب السيرة الذاتية وأفلتها هنا، أو اضغط للاختيار" : "Drag and drop your resume here, or choose a file"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {arabic ? "يدعم PDF أو DOCX أو TXT حتى 5MB" : "Supports PDF, DOCX, or TXT up to 5MB"}
                </p>
              </div>
            )}
          </div>
        </label>

        {busy && !parsed && (
          <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400" role="status">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>{arabic ? "جارٍ استخراج النص من الملف…" : "Extracting text from resume…"}</span>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {parsed && (
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-800 dark:text-slate-200">{parsed.fileName}</p>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                {arabic ? "جاهز للتحليل" : "Ready"}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {parsed.parse.characterCount} {arabic ? "حرفاً مستخرجاً" : "characters extracted"} · {parsed.parse.status}
            </p>
            {parsed.parse.warnings.map((warning) => (
              <p key={warning} className="mt-2 text-sm text-amber-800 dark:text-amber-200">
                {warning}
              </p>
            ))}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
                {arabic ? "معاينة النص المستخرج" : "Preview extracted text"}
              </summary>
              <pre dir="auto" className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                {parsed.text || (arabic ? "لم يُستخرج نص." : "No text was extracted.")}
              </pre>
            </details>
          </div>
        )}
      </section>

      {/* 2. Job description */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold">{arabic ? "٢. الوصف الوظيفي" : "2. Job description"}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {arabic ? "اختياري. اتركه فارغاً لتحليل جاهزية السيرة فقط." : "Optional. Leave blank for resume-only readiness analysis."}
        </p>
        <label htmlFor="job-description" className="mt-4 block text-sm font-medium">
          {arabic ? "الوصف الوظيفي (اختياري)" : "Job description (optional)"}
        </label>
        <textarea
          id="job-description"
          dir="auto"
          rows={10}
          maxLength={100000}
          className="mt-2 block w-full rounded-md border border-slate-300 bg-transparent p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700"
          placeholder={arabic ? "الصق الوصف الوظيفي هنا…" : "Paste the job description here…"}
          {...register("jdText")}
        />
      </section>

      <button
        type="submit"
        disabled={!parsed || busy || parsed.parse.status === "scanned"}
        className="rounded-md bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? (arabic ? "جارٍ التحليل…" : "Analyzing…") : (arabic ? "تحليل السيرة" : "Analyze resume")}
      </button>

      {parsed?.parse.status === "scanned" && (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          {arabic ? "لا يمكن إعطاء درجة موثوقة لملف ممسوح ضوئياً أو بلا نص." : "A reliable score cannot be calculated for a scanned or textless file."}
        </p>
      )}
    </form>
  );
}
