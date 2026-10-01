import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Database,
  EyeOff,
  Lock,
  Phone,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/ui/app-shell";

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.66 1.66 0 0 0-1.66 1.66 1.66 1.66 0 0 0 1.66 1.66 1.66 1.66 0 0 0 1.66-1.66c0-.92-.74-1.66-1.66-1.66Z" />
    </svg>
  );
}

export default async function PrivacyPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const normalized = locale === "ar" ? "ar" : "en";
  const isAr = normalized === "ar";

  return (
    <AppShell locale={normalized}>
      <main className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          {/* Top navigation helper */}
          <div className="mb-6">
            <Link
              href={`/${normalized}`}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className={`h-3.5 w-3.5 ${isAr ? "rotate-180" : ""}`} />
              <span>{isAr ? "العودة إلى الصفحة الرئيسية" : "Back to Home"}</span>
            </Link>
          </div>

          {/* Header Section */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isAr ? "معايير الأمان والخصوصية المعتمدة" : "Privacy & Security Framework"}</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
              {isAr ? "التزامنا الصارم بالخصوصية وحماية البيانات" : "Our Ironclad Commitment to Privacy & Security"}
            </h1>

            <p dir="auto" className="max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
              {isAr
                ? "تم تصميم وبناء منظومة AI Career Assistant وفق مبدأ الخصوصية أولاً (Privacy by Design). بياناتك وسيرتك الذاتية ومراسلاتك لا يتم تخزينها نهائياً في أي قاعدة بيانات، ولا تُستخدم لتدريب نماذج الذكاء الاصطناعي."
                : "AI Career Assistant was architected from day one around strict zero-retention principles. Your resume files, text snippets, and target job descriptions are processed ephemerally and never persisted to databases or used to train AI models."}
            </p>
          </div>

          {/* 4 Core Pillars Grid */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {/* Pillar 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <Database className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
                {isAr ? "100% معالجة مؤقتة في الذاكرة (In-Memory)" : "100% Ephemeral In-Memory Processing"}
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {isAr
                  ? "عند رفع ملف السيرة الذاتية، تتم معالجته في ذاكرة الخادم اللحظية (RAM) دون كتابة أي ملف في وسائط التخزين الدائمة أو قواعد البيانات. بمجرد انتهاء التحليل أو تحميل التقرير، تنتهي الجلسة وتتلاشى البيانات فوراً."
                  : "When you upload a resume or paste job requirements, the content is parsed in transient RAM only. Nothing is saved to disks, databases, or object storage buckets (S3). Data is destroyed as soon as the response is dispatched."}
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
                {isAr ? "عدم تدريب الذكاء الاصطناعي على بياناتك" : "Zero AI Model Training on User Data"}
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {isAr
                  ? "تتم معالجة واستخراج البيانات الدلالية عبر واجهات برمجة مشفرة وموثقة بالكامل. نضمن عدم استخدام أي سيرة ذاتية أو نصوص مدخلة لإعادة تدريب أو تحسين أي نماذج ذكاء اصطناعي."
                  : "Semantic processing takes place through encrypted enterprise API channels. User prompts, parsed resume facts, and outputs are strictly exempt from training or fine-tuning AI models."}
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-purple-300 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                <Cpu className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
                {isAr ? "محاذاة مبنية على الأدلة بلا هلوسة" : "Evidence-Grounded (Anti-Hallucination)"}
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {isAr
                  ? "المنظومة مقيدة بهياكل استخراج حتمية (Deterministic JSON Schemas). لن يقوم النظام أبداً باختلاق خبرات عمل وهمية أو تزوير تواريخ أو ادعاء مهارات لم تذكرها في سيرتك الذاتية."
                  : "The system enforces strict deterministic schema validation. The AI is strictly barred from hallucinating fake company positions, false metrics, or unverified skills not present in your uploaded resume."}
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <EyeOff className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
                {isAr ? "حدود أمان للملفات وتطهير النصوص" : "File Guardrails & Content Sanitization"}
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {isAr
                  ? "نقبل ملفات PDF و DOCX بحد أقصى 5 ميغابايت فقط مع فحص صارم لصيغة الملف. يتم رفض أي ملفات قابلة للتنفيذ أو نصوص مشبوهة، مع فلترة وتطهير البيانات لمنع ثغرات الحقن."
                  : "We strictly accept PDF and DOCX files up to 5 MB with MIME-type validation. Binary executables are rejected immediately, and extracted text undergoes sanitization to prevent prompt injection."}
              </p>
            </div>
          </div>

          {/* Side-by-Side Comparison: What We Guarantee vs What We Never Do */}
          <div className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isAr ? "مقارنة الشفافية الكاملة" : "Complete Transparency Overview"}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {isAr
                ? "نوضح لك بكل أمانة ووضوح ما نقوم به وما نمتنع عنه تماماً."
                : "A direct, unambiguous breakdown of our platform operations and ethical boundaries."}
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {/* What We Guarantee */}
              <div className="space-y-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-5 dark:border-emerald-950/40 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>{isAr ? "ما نضمنه لك دائماً" : "What We Always Guarantee"}</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span>
                      {isAr
                        ? "معالجة فورية ومغلقة داخل الذاكرة دون حفظ ملفاتك."
                        : "Instant in-memory analysis without persistent storage of your files."}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span>
                      {isAr
                        ? "تصدير فوري لتقرير PDF بتصميم رسمي A4 وحفظه مباشرة في جهازك."
                        : "Direct client-side generation and download of official A4 PDF reports."}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span>
                      {isAr
                        ? "فصل صريح بين التدقيق البنيوي الحسابي وبين التوافق الوظيفي."
                        : "Clear architectural split between structural health and job alignment."}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span>
                      {isAr
                        ? "تنبيهات واضحة لأي مهارة مدرجة بلا دليل عملي في الخبرات."
                        : "Constructive flags for any ghost skills lacking practical evidence."}
                    </span>
                  </li>
                </ul>
              </div>

              {/* What We Never Do */}
              <div className="space-y-4 rounded-xl border border-rose-100 bg-rose-50/50 p-5 dark:border-rose-950/40 dark:bg-rose-950/20">
                <div className="flex items-center gap-2 text-sm font-bold text-rose-800 dark:text-rose-300">
                  <XCircle className="h-5 w-5 text-rose-600" />
                  <span>{isAr ? "ما لا نفعله أبداً" : "What We Never Do"}</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0" />
                    <span>
                      {isAr
                        ? "لا نبيع أو نشارك بياناتك أو أرقام هاتفك مع أي طرف ثالث أو شركات توظيف."
                        : "We never sell, rent, or trade your resume data or contacts to recruiters."}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0" />
                    <span>
                      {isAr
                        ? "لا نخترع مهارات أو نسب نجاح وهمية لخداع مسؤولي الموارد البشرية."
                        : "We never hallucinate fraudulent achievements or exaggerated metrics."}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0" />
                    <span>
                      {isAr
                        ? "لا نلزمك بإنشاء حساب أو إدخال بطاقة ائتمان لإجراء التحليل الأساسي."
                        : "We do not require mandatory account creation or credit cards for core analysis."}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0" />
                    <span>
                      {isAr
                        ? "لا نحتفظ بنسخ احتياطية خفية من سيرتك الذاتية بعد انتهاء الاستعلام."
                        : "We keep no hidden backups or cached logs of your CV once your query resolves."}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Scoring Methodology Note */}
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isAr ? "طبيعة وحدود تقييم الـ ATS" : "ATS Evaluation Scope & Transparency"}
              </h2>
            </div>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {isAr
                ? "النتائج والدرجات المعروضة في المنظومة هي تقييمات موضوعية وشفافة مبنية على المعايير القياسية لأنظمة تتبع المتقدمين العالمية (مثل Greenhouse و Lever و Workday). نحن لا ندّعي تمثيل خوارزمية سرية لشركة معينة، بل نمنحك رؤية تفصيلية مبنية على الأدلة الحقيقية لتعزيز فرص قبولك."
                : "Scores and diagnostics produced by this engine are transparent, deterministic estimates benchmarked against industry standards seen in modern applicant tracking systems. They reflect genuine structural hygiene and keyword relevancy to give you authentic, actionable feedback."}
            </p>
          </div>

          {/* Contact Developer & Inquiries */}
          <div className="mt-12 rounded-2xl border border-blue-100 bg-blue-50/50 p-6 sm:p-8 dark:border-blue-900/40 dark:bg-blue-950/30">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  {isAr ? "المسؤولية والمتابعة المباشرة" : "Responsible Engineering"}
                </p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {isAr ? "هل لديك استفسار حول الخصوصية أو الأمان؟" : "Have a Question Regarding Privacy or Security?"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {isAr
                    ? "تم تطوير المنظومة وتدقيقها بالكامل بواسطة أنس الدحامشة (Anas Aldahamsheh). يمكنك التواصل مباشرة لأي استفسار تقني أو أمني."
                    : "Designed and engineered with strict integrity by Anas Aldahamsheh. Reach out directly for any security review or privacy inquiry."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <a
                  href="tel:+962789495167"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Phone className="h-4 w-4 text-blue-600 shrink-0" />
                  <span dir="ltr">+962 789 495 167</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/anas-aldahamsheh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                >
                  <LinkedinIcon className="h-4 w-4 shrink-0" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
