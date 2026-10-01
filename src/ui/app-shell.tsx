"use client";

import Link from "next/link";
import { useState } from "react";
import { Globe, Moon, Phone, Sun } from "lucide-react";

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.66 1.66 0 0 0-1.66 1.66 1.66 1.66 0 0 0 1.66 1.66 1.66 1.66 0 0 0 1.66-1.66c0-.92-.74-1.66-1.66-1.66Z" />
    </svg>
  );
}

function CvLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg className="h-full w-full drop-shadow-sm" viewBox="0 0 100 100" fill="none" aria-hidden="true">
        {/* Document Body with Blue Border */}
        <path d="M22 14C22 10.6863 24.6863 8 28 8H55L75 28V72C75 75.3137 72.3137 78 69 78H28C24.6863 78 22 75.3137 22 72V14Z" fill="#ffffff" stroke="#2563eb" strokeWidth="5" strokeLinejoin="round" />
        {/* Folded Corner */}
        <path d="M55 8V25C55 26.6569 56.3431 28 58 28H75L55 8Z" fill="#2563eb" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
        {/* Avatar Profile inside CV */}
        <circle cx="39" cy="30" r="6" fill="#3b82f6" />
        <path d="M30 46C30 41.5817 34.0294 38 39 38C43.9706 38 48 41.5817 48 46H30Z" fill="#3b82f6" />
        {/* Header Text Lines next to Avatar */}
        <rect x="52" y="32" width="14" height="4" rx="2" fill="#93c5fd" />
        <rect x="52" y="40" width="10" height="4" rx="2" fill="#93c5fd" />
        {/* Body Text Lines below Avatar */}
        <rect x="30" y="52" width="28" height="4" rx="2" fill="#93c5fd" />
        <rect x="30" y="60" width="22" height="4" rx="2" fill="#93c5fd" />
        {/* Green Verification Check Badge */}
        <circle cx="70" cy="65" r="16" fill="#10b981" />
        <path d="M63 65L68 70L77 59" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );
}

type AppShellProps = {
  locale: "ar" | "en";
  children: React.ReactNode;
};

const copy = {
  en: { switchLabel: "العربية", themeLabel: "Dark mode", navLabel: "Main navigation", home: "Home", analyze: "Analyze", privacy: "Privacy" },
  ar: { switchLabel: "English", themeLabel: "الوضع الداكن", navLabel: "التنقل الرئيسي", home: "الرئيسية", analyze: "تحليل CV", privacy: "الخصوصية" },
} as const;

export function AppShell({ locale, children }: AppShellProps) {
  const [dark, setDark] = useState(false);
  const text = copy[locale];
  const alternateLocale = locale === "ar" ? "en" : "ar";

  return (
    <div className={dark ? "dark min-h-screen" : "min-h-screen"}>
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3.5">
            <Link href={`/${locale}`} className="flex items-center gap-2.5 font-bold tracking-tight" aria-label={text.home}>
              <CvLogo className="h-8 w-8" />
              <span className="text-base font-extrabold tracking-tight">
                <span className="text-blue-600 dark:text-blue-400">CV</span> <span className="text-slate-900 dark:text-slate-100">Checker</span>
              </span>
            </Link>

            <nav aria-label={text.navLabel} className="flex items-center gap-2 sm:gap-3 text-sm font-medium">
              <Link
                href={`/${locale}/analyze`}
                className="hidden sm:inline-block text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
              >
                {text.analyze}
              </Link>
              <Link
                href={`/${locale}/privacy`}
                className="hidden sm:inline-block text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
              >
                {text.privacy}
              </Link>
              <Link
                href={`/${alternateLocale}`}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                <Globe className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <span>{text.switchLabel}</span>
              </Link>
              <button
                type="button"
                onClick={() => setDark((current) => !current)}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                aria-label={text.themeLabel}
                aria-pressed={dark}
              >
                {dark ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    <span>{locale === "ar" ? "فاتح" : "Light"}</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                    <span>{locale === "ar" ? "داكن" : "Dark"}</span>
                  </>
                )}
              </button>
            </nav>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="mt-auto border-t border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-950/95">
          <div className="mx-auto max-w-5xl px-6 py-10">
            <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
              {/* Brand & Creator Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <CvLogo className="h-9 w-9" />
                  <div>
                    <h3 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                      <span className="text-blue-600 dark:text-blue-400">CV</span> Checker
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {locale === "ar" ? "تطوير: أنس الدحامشة" : "Engineered by Anas Aldahamsheh"}
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {locale === "ar"
                    ? "منظومة هجينة متقدمة لفحص وتحليل السيرة الذاتية مدعومة بالذكاء الدلالي المتقدم والتدقيق الهيكلي الدقيق."
                    : "Next-gen hybrid ATS & resume health engine powered by advanced semantic intelligence and deterministic structural auditing."}
                </p>
              </div>

              {/* Developer Contacts */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {locale === "ar" ? "بيانات التواصل المباشر" : "Contact Developer"}
                </h4>
                <div className="flex flex-col items-start gap-2.5 text-xs">
                  {/* Phone */}
                  <a
                    href="tel:+962789495167"
                    className="group inline-flex items-center gap-2.5 font-medium text-slate-700 transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600 transition group-hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                    </div>
                    <span dir="ltr" className="font-mono text-xs">+962 789 495 167</span>
                  </a>

                  {/* LinkedIn */}
                  <a
                    href="https://www.linkedin.com/in/anas-aldahamsheh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2.5 font-medium text-slate-700 transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-[#0077b5] transition group-hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400">
                      <LinkedinIcon className="h-3.5 w-3.5 shrink-0" />
                    </div>
                    <span dir="ltr" className="font-mono text-xs">linkedin.com/in/anas-aldahamsheh</span>
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {locale === "ar" ? "روابط سريعة" : "Navigation"}
                </h4>
                <div className="flex flex-col gap-2 text-xs font-medium">
                  <Link href={`/${locale}`} className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                    {locale === "ar" ? "الصفحة الرئيسية" : "Home"}
                  </Link>
                  <Link href={`/${locale}/analyze`} className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                    {locale === "ar" ? "تحليل السيرة الذاتية والوظائف" : "Analyze Resume"}
                  </Link>
                  <Link href={`/${locale}/privacy`} className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                    {locale === "ar" ? "معايير الأمان والخصوصية" : "Privacy & Security"}
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom copyright line */}
            <div className="mt-8 border-t border-slate-200 pt-5 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:text-start">
              <p>
                © 2026 <strong>Anas Aldahamsheh</strong>. {locale === "ar" ? "جميع الحقوق محفوظة." : "All rights reserved."}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
