import { describe, expect, it } from "vitest";
import { extractJobFallback, extractResumeFallback } from "@/ai/analysis/fallback";
import { assessContactDetails, sectionStructure } from "@/ats/checks/resume-checks";
import { buildAnalysis, deterministicMatches } from "@/ats/analysis/engine";
import { calculateAtsScore, calculateJobMatchScore, weightedCoverage } from "@/ats/scoring/score";
import type { JobRequirement, RequirementMatch, ResumeEvidence } from "@/ats/contracts/analysis";

describe("Semantic-First Analysis Engine Regressions", () => {
  it("recognizes 'Amman' as a valid location and does not report City/Location missing", () => {
    const resumeText = `
Anas Aldahamsheh
Amman | +962 789 495 167 | anas@example.com
Professional Summary
Software and AI engineer based in Amman.
Experience
Software Engineer at Tech Co (2022 - Present)
• Developed AI workflow systems.
Skills
Python, TypeScript
Education
B.Sc. in Computer Science
    `;

    const resume = extractResumeFallback(resumeText);
    expect(resume.candidate.location).toBe("Amman");

    const contact = assessContactDetails(resume);
    expect(contact.hasLocation).toBe(true);
    expect(contact.missingFields).not.toContain("City / Location");
    expect(contact.arabicMissingFields).not.toContain("المدينة أو الموقع الجغرافي");
  });

  it("handles LinkedIn label when URL is not in text without reporting LinkedIn missing", () => {
    const resumeText = `
Anas Aldahamsheh
Amman | +962 789 495 167 | anas@example.com | LinkedIn
Professional Summary
AI engineer.
    `;

    const resume = extractResumeFallback(resumeText);
    const contact = assessContactDetails(resume);

    // Label exists, URL not yet resolved
    expect(contact.hasLinks).toBe(true);
    expect(contact.linksStatus).toBe("label_present_url_unverified");
    expect(contact.missingFields).not.toContain("LinkedIn or professional portfolio link");
    expect(contact.unverifiedFields).toContain("LinkedIn hyperlink unverified");

    // Engine recommendation should advise verifying link, NOT adding missing LinkedIn
    const analysis = buildAnalysis({
      resume,
      job: null,
      resumeText,
      provider: "deterministic-fallback"
    });

    const addLinkedInRec = analysis.recommendations.find(
      (r) => r.title.includes("LinkedIn") && r.title.includes("Add")
    );
    expect(addLinkedInRec).toBeUndefined();

    const verifyRec = analysis.recommendations.find((r) =>
      r.title.includes("Verify embedded hyperlinks") || r.title.includes("تحقق من تفعيل الروابط")
    );
    expect(verifyRec).toBeDefined();
  });

  it("links extracted hyperlink metadata from PDF/DOCX to candidate profile", () => {
    const resumeText = `
Anas Aldahamsheh
Amman | +962 789 495 167 | anas@example.com | LinkedIn
    `;
    const hyperlinks = [
      { url: "https://www.linkedin.com/in/anas-aldahamsheh", label: "LinkedIn" },
      { url: "https://github.com/anas-aldahamsheh", label: "GitHub" }
    ];

    const resume = extractResumeFallback(resumeText, hyperlinks);
    expect(resume.candidate.linksDetails?.linkedin?.status).toBe("verified");
    expect(resume.candidate.linksDetails?.linkedin?.url).toBe("https://www.linkedin.com/in/anas-aldahamsheh");
    expect(resume.candidate.links).toContain("https://www.linkedin.com/in/anas-aldahamsheh");

    const contact = assessContactDetails(resume);
    expect(contact.hasLinks).toBe(true);
    expect(contact.linksStatus).toBe("verified");
    expect(contact.missingFields).toHaveLength(0);
    expect(contact.unverifiedFields).toHaveLength(0);
  });

  it("detects sections semantically using diverse headings", () => {
    const resume: ResumeEvidence = {
      candidate: { name: "Anas", email: "a@b.com", phone: "+962789495167", location: "Amman", links: [] },
      summary: "AI specialist with background in agent orchestration.",
      roles: [{ title: "AI Engineer", company: "Co", startDate: "2023", endDate: "2024", bullets: ["Built agents"] }],
      skills: ["Python", "TypeScript"],
      education: ["B.Sc. Computer Engineering"],
      certifications: ["AWS Certified"],
      projects: ["CV Checker"],
      evidenceItems: [{ id: "E1", text: "Built agents", sourceSection: "experience" }],
      detectedSections: {
        summary: { present: true, detectedHeading: "About Me" },
        experience: { present: true, detectedHeading: "Career History" },
        education: { present: true, detectedHeading: "Academic Qualifications" },
        skills: { present: true, detectedHeading: "Core Competencies" },
        projects: { present: true, detectedHeading: "Selected Projects" }
      }
    };

    expect(sectionStructure(resume)).toBe(1.0); // 5/5 sections present
  });

  it("classifies items under Requirements as required and Nice-to-Haves as preferred", () => {
    const jdText = `
Role: Senior AI Engineer

Requirements:
- Strong Python engineering
- Experience with FastAPI and REST APIs

Nice-to-Haves:
- Docker and Kubernetes
- Cloud deployment on GCP
    `;

    const job = extractJobFallback(jdText);
    const pythonSkill = job.hardSkills.find((s) => s.name.toLowerCase() === "python");
    expect(pythonSkill?.importance).toBe("required");

    const dockerSkill = job.hardSkills.find((s) => s.name.toLowerCase() === "docker");
    expect(dockerSkill?.importance).toBe("preferred");
  });

  it("does not award 100% Hard Skills score for skills that only appear in a skills list", () => {
    const requirements: JobRequirement[] = [
      { id: "R1", name: "Python", importance: "required", sourceText: "Python", kind: "skill" },
      { id: "R2", name: "LangChain", importance: "required", sourceText: "LangChain", kind: "skill" }
    ];

    // Candidate has Python in practical experience, but LangChain only listed as a keyword
    const matches: RequirementMatch[] = [
      {
        requirementId: "R1",
        status: "supported",
        evidenceStrength: "strong",
        evidenceMultiplier: 1.0,
        evidenceIds: ["E1"],
        reason: "Used in production",
        confidence: 0.95
      },
      {
        requirementId: "R2",
        status: "partial",
        evidenceStrength: "keyword_only",
        evidenceMultiplier: 0.2, // Keyword-only multiplier
        evidenceIds: [],
        reason: "Only mentioned in skills section",
        confidence: 0.8
      }
    ];

    const score = weightedCoverage(requirements, matches);
    // (2 * 1.0 + 2 * 0.2) / 4 = 2.4 / 4 = 0.60
    expect(score).toBeCloseTo(0.6, 2);
    expect(score).toBeLessThan(1.0);
  });

  it("does not award experience duration score when the job description does not specify years", () => {
    const resumeText = `
Anas Aldahamsheh
Amman | +962 789 495 167 | anas@example.com
Experience
Software Engineer (Jan 2022 - Present)
• Built agent platforms.
Skills
Python
    `;

    const resume = extractResumeFallback(resumeText);
    // Job without required years
    const job = extractJobFallback(`
AI Engineer
Requirements:
- Python
    `);

    expect(job.requiredYears).toBeNull();
    expect(job.yearsSpecified).toBe(false);

    const analysis = buildAnalysis({
      resume,
      job,
      resumeText,
      provider: "deterministic-fallback"
    });

    expect(analysis.components.experience).toBeNull();

    // Verify calculateJobMatchScore does not crash and distributes weight across remaining components
    const matchScore = calculateJobMatchScore(analysis.components);
    expect(matchScore).toBeTypeOf("number");
    expect(matchScore).toBeGreaterThanOrEqual(0);
    expect(matchScore).toBeLessThanOrEqual(100);

    const atsScore = calculateAtsScore(analysis.components);
    expect(atsScore).toBeTypeOf("number");
    expect(atsScore).toBeGreaterThanOrEqual(0);
    expect(atsScore).toBeLessThanOrEqual(100);
  });

  it("evaluates preferred skills independently and does not collapse partial match to 100%", () => {
    const resume: ResumeEvidence = {
      candidate: { name: "Candidate", email: "c@c.com", phone: "+962789495167", location: "Amman", links: [] },
      summary: "Engineer",
      roles: [],
      skills: ["Docker"], // Has Docker only in skills list
      education: [],
      certifications: [],
      projects: [],
      evidenceItems: []
    };

    const requirements: JobRequirement[] = [
      { id: "R1", name: "Docker", importance: "preferred", sourceText: "Docker", kind: "skill" },
      { id: "R2", name: "Kubernetes", importance: "preferred", sourceText: "Kubernetes", kind: "skill" }
    ];

    const matches = deterministicMatches(resume, requirements);
    const dockerMatch = matches.find((m) => m.requirementId === "R1");
    expect(dockerMatch?.evidenceStrength).toBe("keyword_only");
    expect(dockerMatch?.evidenceMultiplier).toBe(0.2);

    const k8sMatch = matches.find((m) => m.requirementId === "R2");
    expect(k8sMatch?.status).toBe("not_found");

    const preferredCoverage = Math.round(weightedCoverage(requirements, matches) * 100);
    // Total weight = 2. Docker gives 0.2, K8s gives 0 -> 0.2 / 2 = 10%
    expect(preferredCoverage).toBe(10);
    expect(preferredCoverage).toBeLessThan(100);
  });

  it("treats unspecified seniority as not required and does not fabricate a hard match", () => {
    const resume = extractResumeFallback("Anas\nAmman | a@b.com | +962789495167\nExperience\nDeveloper 2023-2024");
    const job = extractJobFallback("Developer\nResponsibilities:\n- Develop apps");

    expect(job.seniority).toBeNull();
    expect(job.senioritySpecified).toBe(false);

    const analysis = buildAnalysis({
      resume,
      job,
      resumeText: "Anas\nAmman | a@b.com",
      provider: "deterministic-fallback"
    });

    expect(analysis.jobMatchDetails?.seniorityMatch.status).toBe("unspecified");
    expect(analysis.jobMatchDetails?.seniorityMatch.specified).toBe(false);
  });
});
