import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Clock,
  FileCheck,
  FileText,
  Search,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/ui/app-shell";

export default async function HomePage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  return (
    <AppShell locale={isArabic ? "ar" : "en"}>
      <main className="px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-5xl">
          {/* Hero Headline */}
          <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-slate-900 dark:text-slate-100">
            {isArabic ? (
              <>
                افحص سيرتك الذاتية بذكاء حقيقي واجتز أنظمة الـ <span className="text-blue-600 dark:text-blue-400">ATS</span> بثقة
              </>
            ) : (
              <>
                Elevate your resume with deep <span className="text-blue-600 dark:text-blue-400">ATS intelligence</span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p dir="auto" className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            {isArabic
              ? "منصة ذكية لتدقيق السيرة الذاتية واجتياز أنظمة الـ ATS بثقة. تفحص بنية الـ CV واكتمال بياناته، تطابق خبراتك مع متطلبات الوظيفة المستهدفة، تكتشف الفجوات والمهارات الناقصة، وتصيغ خطابات تقديم احترافية ومخصصة."
              : "Smart resume auditing and ATS optimization. Check structural health, match your verified qualifications against target job requirements, uncover critical skill gaps, and generate tailored applications effortlessly."}
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link
              href={`/${locale}/analyze`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span>{isArabic ? "ابدأ التحليل الآن مجاناً" : "Start Full Analysis"}</span>
              <ArrowRight className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />
            </Link>

            <Link
              href={`/${locale}/privacy`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>{isArabic ? "معايير الخصوصية والأمان" : "Privacy & Security"}</span>
            </Link>
          </div>

          {/* Feature Showcase Grid */}
          <div className="mt-16 space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {isArabic ? "ما الذي تقدمه لك المنظومة بذكاء؟" : "What Makes This System Truly Intelligent?"}
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                {isArabic
                  ? "فصل معماري حاسم بين التدقيق الحسابي الدقيق للبنية وبين الفهم الدلالي للوظائف."
                  : "A robust separation between deterministic structural auditing and deep semantic job reasoning."}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <FileCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-3.5 text-base font-bold text-slate-900 dark:text-slate-100">
                  {isArabic ? "صحة وهيكل السيرة الذاتية" : "Resume Health & Structure"}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {isArabic
                    ? "تشخيص محدد لنواقص التواصل (هاتف، LinkedIn، إيميل)، والتحقق من الترتيب الزمني العكسي، وكثافة الكلمات."
                    : "Granular diagnostics for missing contact info, standard ATS sections, reverse-chronological order, and text density."}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <Briefcase className="h-5 w-5" />
                </div>
                <h3 className="mt-3.5 text-base font-bold text-slate-900 dark:text-slate-100">
                  {isArabic ? "المطابقة الوظيفية وكشف الفجوات" : "Deep Job Match & Gap Analysis"}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {isArabic
                    ? "تفريق دقيق بين المهارات الإلزامية (Must-Haves) والمفضلة (Nice-To-Haves)، وإبراز أي مهارة حرجة ناقصة قد تعرضك للاستبعاد."
                    : "Categorizes required vs preferred skills, highlights critical missing qualifications, and evaluates seniority compatibility."}
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                  <Search className="h-5 w-5" />
                </div>
                <h3 className="mt-3.5 text-base font-bold text-slate-900 dark:text-slate-100">
                  {isArabic ? "كشف المهارات بلا دليل (Ghost Skills)" : "Ghost Skills Detection"}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {isArabic
                    ? "مطابقة المهارات المكتوبة في قائمة المهارات مع واقع إنجازاتك في الخبرات والمشاريع لتنبيهك لدعمها بتطبيق عملي."
                    : "Identifies keywords listed in your skills section that have zero practical demonstration in your experience or projects."}
                </p>
              </div>

              {/* Feature 4 */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="mt-3.5 text-base font-bold text-slate-900 dark:text-slate-100">
                  {isArabic ? "كشف الفجوات الزمنية (Gaps)" : "Timeline Gap Analysis"}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {isArabic
                    ? "حساب دقيق لسنوات الخبرة بالشهور وكشف فترات الانقطاع التي تتجاوز 6 أشهر بين الوظائف مع توجيهات لتوضيحها."
                    : "Calculates precise total experience months and highlights career gaps exceeding 6 months with constructive guidance."}
                </p>
              </div>

              {/* Feature 5 */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="mt-3.5 text-base font-bold text-slate-900 dark:text-slate-100">
                  {isArabic ? "خطاب تقديم ذكي (AI Cover Letter)" : "Targeted AI Cover Letter"}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {isArabic
                    ? "توليد خطاب تقديم رسمي ومقنع يربط أقوى إنجازاتك الموثقة بمتطلبات الوظيفة المستهدفة دون أي قوالب جامدة."
                    : "Generates cohesive, convincing job application letters connecting verified achievements directly to job requirements."}
                </p>
              </div>

              {/* Feature 6 */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-3.5 text-base font-bold text-slate-900 dark:text-slate-100">
                  {isArabic ? "خصوصية تامة 100% ومخرجات PDF" : "Zero-Retention Privacy & PDF"}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {isArabic
                    ? "معالجة مؤقتة في الذاكرة دون حفظ ملفك في أي قاعدة بيانات، مع إمكانية تنزيل التقرير الرسمي PDF قياس A4."
                    : "Processed ephemerally in client memory with zero server databases. Instant download of official A4 vector PDF reports."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
