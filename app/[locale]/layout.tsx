import type { Metadata } from "next";
import "../globals.css";
import { AnalysisProvider } from "@/features/ats-analysis/analysis-store";

export const metadata: Metadata = {
  title: "CV Checker | By Anas Aldahamsheh",
  description: "CV Checker & ATS Optimization Engine by Anas Aldahamsheh.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=4", sizes: "32x32" },
      { url: "/icon.svg?v=4", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico?v=4",
    apple: "/icon.svg?v=4",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  return (
    <html lang={isArabic ? "ar" : "en"} dir={isArabic ? "rtl" : "ltr"}>
      <head>
        <link rel="icon" href="/favicon.ico?v=4" sizes="32x32" />
        <link rel="icon" href="/icon.svg?v=4" type="image/svg+xml" />
      </head>
      <body><AnalysisProvider>{children}</AnalysisProvider></body>
    </html>
  );
}
