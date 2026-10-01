"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/ui/app-shell";
import { useAnalysis } from "@/features/ats-analysis/analysis-store";
import { ResultsDashboard } from "@/features/ats-analysis/results-dashboard";
export default function ResultsPage() { const params = useParams<{ locale: string }>(); const locale = params.locale === "ar" ? "ar" : "en"; const { result } = useAnalysis(); const arabic = locale === "ar"; return <AppShell locale={locale}><main className="px-6 py-12"><div className="mx-auto max-w-5xl">{result ? <ResultsDashboard locale={locale} result={result} /> : <section className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900"><h1 className="text-2xl font-bold">{arabic ? "لا يوجد تحليل في هذه الجلسة" : "No analysis in this session"}</h1><p className="mt-3 text-slate-600 dark:text-slate-300">{arabic ? "للخصوصية، لا يتم حفظ السيرة أو النتائج. ابدأ تحليلاً جديداً." : "For privacy, resumes and results are not stored. Start a new analysis."}</p><Link href={`/${locale}/analyze`} className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 font-semibold text-white">{arabic ? "بدء تحليل" : "Start analysis"}</Link></section>}</div></main></AppShell>; }
