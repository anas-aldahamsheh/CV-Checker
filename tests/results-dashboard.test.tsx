// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ResultsDashboard } from "@/features/ats-analysis/results-dashboard";
import type { AnalysisResult } from "@/ats/contracts/analysis";

afterEach(() => {
  cleanup();
});

const result: AnalysisResult = { mode: "job-match", score: 78, resumeQuality: 80, confidence: 90, parse: { status: "good", characterCount: 300, warnings: [], usefulText: true, garbageRatio: 0, longUnbrokenText: false }, components: { parseability: 1, contact: 1, sections: 0.8, roleAlignment: 0.8, hardSkills: 0.75, experience: 1, keywords: 0.7, achievements: 0.6, educationCertification: null }, resume: { candidate: { name: "Taylor", email: "taylor@example.com", phone: null, location: null, links: [] }, summary: "Frontend developer", roles: [], skills: ["react"], education: [], certifications: [], projects: [], evidenceItems: [{ id: "E1", text: "Built a React dashboard.", sourceSection: "experience" }] }, job: { jobTitle: "Frontend Engineer", seniority: null, requiredYears: null, hardSkills: [], responsibilities: [], educationRequirements: [], certificationRequirements: [], keywords: [], softSkills: [] }, requirements: [], matches: [], recommendations: [], provider: "deterministic-fallback" };

describe("results dashboard", () => {
  it("exposes the score and transparent weighted breakdown", () => {
    render(<ResultsDashboard locale="en" result={result} />);
    expect(screen.getByRole("img", { name: "ATS Compatibility Score: 78 out of 100" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "ATS" }));
    expect(screen.getByRole("columnheader", { name: "Weight" })).toBeInTheDocument();
    expect(screen.getByText("20/20")).toBeInTheDocument();
  });

  it("hides job-specific cards in resume-only mode and uses resume health weights", () => {
    const resumeOnlyResult: AnalysisResult = {
      ...result,
      mode: "resume-only",
      score: null,
      job: null,
      components: {
        ...result.components,
        roleAlignment: null,
        keywords: null,
      }
    };
    render(<ResultsDashboard locale="en" result={resumeOnlyResult} />);
    expect(screen.queryByText("Role alignment")).not.toBeInTheDocument();
    expect(screen.queryByText("Keywords")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "ATS" }));
    expect(screen.getByText("Resume Health & Structure Breakdown")).toBeInTheDocument();
  });

  it("renders the PDF download button in English and Arabic", () => {
    const { rerender } = render(<ResultsDashboard locale="en" result={result} />);
    expect(screen.getByRole("button", { name: /download pdf report/i })).toBeInTheDocument();

    rerender(<ResultsDashboard locale="ar" result={result} />);
    expect(screen.getByRole("button", { name: /تنزيل تقرير pdf/i })).toBeInTheDocument();
  });

  it("renders the 'Check another CV' link directing to /analyze in English and Arabic", () => {
    const { rerender } = render(<ResultsDashboard locale="en" result={result} />);
    const linkEn = screen.getByRole("link", { name: /check another cv/i });
    expect(linkEn).toBeInTheDocument();
    expect(linkEn).toHaveAttribute("href", "/en/analyze");

    rerender(<ResultsDashboard locale="ar" result={result} />);
    const linkAr = screen.getByRole("link", { name: /فحص سيرة ذاتية أخرى/i });
    expect(linkAr).toBeInTheDocument();
    expect(linkAr).toHaveAttribute("href", "/ar/analyze");
  });

  it("renders the redesigned AI Cover Letter tab with two clear buttons (Job-Tailored & General)", () => {
    render(<ResultsDashboard locale="en" result={result} />);
    fireEvent.click(screen.getByRole("tab", { name: /ai cover letter/i }));

    const jobBtn = screen.getByRole("button", { name: /generate job cover letter/i });
    const generalBtn = screen.getByRole("button", { name: /generate general cover letter/i });

    expect(jobBtn).toBeInTheDocument();
    expect(jobBtn).not.toBeDisabled();
    expect(generalBtn).toBeInTheDocument();
    expect(generalBtn).not.toBeDisabled();

    // Verify old removed settings are NOT in the document
    expect(screen.queryByLabelText(/application question/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/rewrite evidence bullet/i)).not.toBeInTheDocument();
  });

  it("disables the job-tailored cover letter button when no job description is supplied and shows explanation", () => {
    const resumeOnlyResult: AnalysisResult = {
      ...result,
      mode: "resume-only",
      job: null
    };

    render(<ResultsDashboard locale="en" result={resumeOnlyResult} />);
    fireEvent.click(screen.getByRole("tab", { name: /ai cover letter/i }));

    const jobBtn = screen.getByRole("button", { name: /generate job cover letter/i });
    const generalBtn = screen.getByRole("button", { name: /generate general cover letter/i });

    expect(jobBtn).toBeDisabled();
    expect(generalBtn).not.toBeDisabled();
    expect(screen.getByText(/a target job description is required/i)).toBeInTheDocument();
  });
});
