import type { JobRequirement, JobRequirements, ResumeEvidence, ResumeRole } from "@/ats/contracts/analysis";
import { evaluateAchievements } from "@/ats/checks/resume-checks";
import { canonicalTerm, includesTerm, uniqueTerms } from "@/ats/normalization/text";

const knownSkills = [
  "javascript",
  "typescript",
  "react",
  "next.js",
  "node.js",
  "python",
  "java",
  "sql",
  "postgresql",
  "mysql",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "figma",
  "excel",
  "git",
  "html",
  "css",
  "machine learning",
  "project management",
  "agile",
  "scrum",
  "power bi",
  "tableau",
  "langchain",
  "rag",
  "fastapi",
  "rest api"
];

const sectionLabels: Record<string, ResumeEvidence["evidenceItems"][number]["sourceSection"]> = {
  summary: "summary",
  profile: "summary",
  "about me": "summary",
  overview: "summary",
  ملخص: "summary",
  "نبذة شخصية": "summary",
  experience: "experience",
  employment: "experience",
  "work history": "experience",
  "career history": "experience",
  "professional experience": "experience",
  الخبرة: "experience",
  الخبرات: "experience",
  education: "education",
  "academic background": "education",
  التعليم: "education",
  skills: "skills",
  "technical skills": "skills",
  competencies: "skills",
  المهارات: "skills",
  certifications: "certifications",
  certificates: "certifications",
  الشهادات: "certifications",
  projects: "projects",
  "key projects": "projects",
  المشاريع: "projects",
  languages: "other",
  اللغات: "other"
};

const actionPattern =
  /\b(led|built|managed|created|improved|developed|designed|delivered|implemented|launched|analyzed|automated|increased|reduced|architected|spearheaded)\b|(?:قمت|طورت|أدرت|صممت|أنشأت|حسنت|نفذت|هندست)/i;

function nonEmptyLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[•▪*-]\s*/, ""))
    .filter(
      (line) =>
        Boolean(line) &&
        !/\b(ignore (all |previous |these )?instructions?|disregard|system prompt|you are chatgpt|return (only )?json|follow these instructions)\b|تجاهل (كل |هذه )?التعليمات|تعليمات النظام/i.test(
          line
        )
    );
}

function sectionContent(lines: string[], names: string[]) {
  const index = lines.findIndex((line) => names.some((name) => canonicalTerm(line).includes(name)));
  if (index < 0) return [];
  const output: string[] = [];
  for (const line of lines.slice(index + 1)) {
    if (Object.keys(sectionLabels).some((name) => canonicalTerm(line) === name)) break;
    output.push(line);
  }
  return output;
}

const ranges =
  /(.*?)\s*(?:\||,|—|-)?\s*((?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[a-z]*\s+\d{4}|\d{4}[-/]\d{1,2}|\d{4})\s*(?:-|–|—|to)\s*((?:present|current|now|حتى الآن|الحالي)|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[a-z]*\s+\d{4}|\d{4}[-/]\d{1,2}|\d{4})/i;

function parseRoles(lines: string[]): ResumeRole[] {
  const roles: ResumeRole[] = [];
  let currentRole: ResumeRole | null = null;
  for (const line of lines) {
    const match = line.match(ranges);
    if (match) {
      const rawTitle = match[1].trim();
      let title = rawTitle || "Role";
      let company = "";
      if (rawTitle.includes("|")) {
        const parts = rawTitle.split("|");
        title = parts[0].trim();
        company = parts.slice(1).join(" ").trim();
      } else if (/\bat\b/i.test(rawTitle)) {
        const parts = rawTitle.split(/\bat\b/i);
        title = parts[0].trim();
        company = parts.slice(1).join(" ").trim();
      }
      currentRole = {
        title: title || "Role",
        company,
        startDate: match[2],
        endDate: match[3],
        bullets: []
      };
      roles.push(currentRole);
    } else if (currentRole && line.trim().length > 0) {
      currentRole.bullets.push(line.trim());
    }
  }
  return roles;
}

export function extractResumeFallback(
  text: string,
  hyperlinks?: Array<{ url: string; label?: string }>
): ResumeEvidence {
  const lines = nonEmptyLines(text);
  const content = lines.join("\n");
  const email = content.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] ?? null;
  const phone = content.match(/(?:\+?\d[\d ()-]{7,}\d)/)?.[0] ?? null;

  // Semantic location extraction
  const cityRegex =
    /\b(Amman(?:,\s*Jordan)?|عمّان|Dubai|دبي|Riyadh|الرياض|London|Cairo|القاهرة|New York|Berlin|Toronto|Doha|الدوحة|Kuwait|الكويت|Abu Dhabi|أبوظبي|Jeddah|جدة)\b/i;
  const cityMatch = content.match(cityRegex);
  const location = cityMatch ? cityMatch[0] : null;

  // Hyperlinks & platform labels
  const textUrls = [...content.matchAll(/https?:\/\/[^\s)]+/gi)].map((match) => match[0]);
  const allUrls = Array.from(new Set([...(hyperlinks?.map((h) => h.url) ?? []), ...textUrls]));

  const linkedInUrl = allUrls.find((u) => /linkedin\.com/i.test(u)) ?? null;
  const gitHubUrl = allUrls.find((u) => /github\.com/i.test(u)) ?? null;
  const portfolioUrl = allUrls.find((u) => !/linkedin|github/i.test(u)) ?? null;

  const linkedInLabel = /\blinkedin\b/i.test(content) || Boolean(linkedInUrl);
  const gitHubLabel = /\bgithub\b/i.test(content) || Boolean(gitHubUrl);
  const portfolioLabel = /\b(portfolio|website|github\.io)\b/i.test(content) || Boolean(portfolioUrl);

  const skills = uniqueTerms(knownSkills.filter((skill) => includesTerm(content, skill)));
  const experienceLines = sectionContent(lines, [
    "experience",
    "employment",
    "work history",
    "career history",
    "professional experience",
    "الخبرة",
    "الخبرات"
  ]);
  const roles = parseRoles(experienceLines.length ? experienceLines : lines);
  const bullets = roles.length > 0 && roles.some((r) => r.bullets.length > 0)
    ? roles.flatMap((r) => r.bullets)
    : experienceLines.filter((line) => line.trim().length > 0 && !line.match(ranges));
  if (roles.length && !roles.some((r) => r.bullets.length > 0)) {
    for (const bullet of bullets) roles[0].bullets.push(bullet);
  }

  const summaryLines = sectionContent(lines, ["summary", "profile", "about me", "overview", "ملخص", "نبذة"]);
  const educationLines = sectionContent(lines, ["education", "academic", "التعليم"]);
  const certLines = sectionContent(lines, ["certifications", "certificates", "الشهادات"]);
  const projectLines = sectionContent(lines, ["projects", "المشاريع"]);

  const evidenceItems = [
    ...summaryLines.slice(0, 3).map((item, index) => ({
      id: `E${index + 1}`,
      text: item,
      sourceSection: "summary" as const
    })),
    ...bullets.map((item, index) => ({
      id: `E${index + 4}`,
      text: item,
      sourceSection: "experience" as const
    })),
    ...skills.map((item, index) => ({
      id: `E${index + 4 + bullets.length}`,
      text: item,
      sourceSection: "skills" as const
    }))
  ];

  const detectedSections = {
    summary: { present: summaryLines.length > 0, detectedHeading: summaryLines.length > 0 ? "Summary" : null },
    experience: {
      present: experienceLines.length > 0 || roles.length > 0,
      detectedHeading: experienceLines.length > 0 || roles.length > 0 ? "Experience" : null
    },
    education: { present: educationLines.length > 0, detectedHeading: educationLines.length > 0 ? "Education" : null },
    skills: {
      present: skills.length > 0 || sectionContent(lines, ["skills", "المهارات"]).length > 0,
      detectedHeading: "Skills"
    },
    projects: { present: projectLines.length > 0, detectedHeading: projectLines.length > 0 ? "Projects" : null },
    certifications: { present: certLines.length > 0, detectedHeading: certLines.length > 0 ? "Certifications" : null },
    languages: { present: false, detectedHeading: null }
  };

  const baseEvidence: ResumeEvidence = {
    candidate: {
      name: lines[0] ?? null,
      email,
      phone,
      location,
      locationStatus: location ? "present" : "missing",
      links: allUrls,
      linksDetails: {
        linkedin: {
          present: linkedInLabel,
          labelDetected: linkedInLabel,
          urlDetected: Boolean(linkedInUrl),
          url: linkedInUrl,
          status: linkedInUrl ? "verified" : linkedInLabel ? "label_present_url_unverified" : "missing"
        },
        github: {
          present: gitHubLabel,
          labelDetected: gitHubLabel,
          urlDetected: Boolean(gitHubUrl),
          url: gitHubUrl,
          status: gitHubUrl ? "verified" : gitHubLabel ? "label_present_url_unverified" : "missing"
        },
        portfolio: {
          present: portfolioLabel,
          labelDetected: portfolioLabel,
          urlDetected: Boolean(portfolioUrl),
          url: portfolioUrl,
          status: portfolioUrl ? "verified" : portfolioLabel ? "label_present_url_unverified" : "missing"
        }
      }
    },
    summary: summaryLines.join(" "),
    roles,
    skills,
    education: educationLines,
    certifications: certLines,
    projects: projectLines,
    evidenceItems,
    detectedSections
  };

  const achievementEvaluation = evaluateAchievements(baseEvidence);

  return {
    ...baseEvidence,
    bulletAchievements: achievementEvaluation.bullets,
    achievementExplanation: achievementEvaluation.explanation
  };
}

function importanceFor(source: string, term: string) {
  const lower = source.toLowerCase();
  const termIdx = lower.indexOf(term.toLowerCase());
  if (termIdx === -1) return "required" as const;

  const textBefore = lower.slice(0, termIdx);
  const lastNice = Math.max(
    textBefore.lastIndexOf("nice-to-have"),
    textBefore.lastIndexOf("nice to have"),
    textBefore.lastIndexOf("preferred"),
    textBefore.lastIndexOf("bonus"),
    textBefore.lastIndexOf("good to have")
  );
  const lastReq = Math.max(
    textBefore.lastIndexOf("requirement"),
    textBefore.lastIndexOf("must"),
    textBefore.lastIndexOf("qualification"),
    textBefore.lastIndexOf("what you need"),
    textBefore.lastIndexOf("مطلوب"),
    textBefore.lastIndexOf("شروط")
  );

  if (lastNice > lastReq) {
    return "preferred" as const;
  }
  if (lastReq > lastNice) {
    return "required" as const;
  }

  return /\b(require|must|mandatory|مطلوب|يجب|ضروري)\b/i.test(source)
    ? ("required" as const)
    : ("preferred" as const);
}

export function extractJobFallback(text: string): JobRequirements {
  const lines = nonEmptyLines(text);
  const content = lines.join("\n");
  const jobTitle = lines[0] ?? "";
  const seniority =
    content.match(/\b(intern|junior|mid(?:-level)?|senior|lead|principal|manager|مدير|مبتدئ|خبير)\b/i)?.[0] ?? null;

  const yearValues = [...content.matchAll(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|سنوات?)/gi)].map((match) =>
    Number(match[1])
  );
  const requiredYears = yearValues.length ? Math.max(...yearValues) : null;
  const yearsSpecified = requiredYears !== null;
  const senioritySpecified = seniority !== null;

  const hardSkills = uniqueTerms(knownSkills.filter((skill) => includesTerm(content, skill))).map((name, index) => ({
    id: `R${index + 1}`,
    name,
    importance: importanceFor(content, name),
    sourceText: name
  }));

  const responsibilityLines = lines
    .filter(
      (line) =>
        actionPattern.test(line) ||
        /\b(collaborate|own|drive|support|maintain|build|design|develop|إدارة|تطوير|تصميم)\b/i.test(line)
    )
    .slice(0, 10);

  const educationRequirements = lines.filter((line) =>
    /\b(bachelor|master|phd|degree|university|بكالوريوس|ماجستير|دكتوراه)\b/i.test(line)
  );
  const certificationRequirements = lines.filter((line) =>
    /\b(certification|certified|certificate|شهادة|معتمد)\b/i.test(line)
  );
  const softSkills = lines.filter((line) =>
    /\b(communication|leadership|teamwork|problem solving|التواصل|القيادة|العمل الجماعي)\b/i.test(line)
  );
  const keywords = uniqueTerms(
    lines.flatMap((line) => line.split(/[,;|]/).map((item) => item.trim())).filter((item) => item.length >= 3)
  ).slice(0, 40);

  const atomicRequirements: JobRequirement[] = [
    ...hardSkills.map((h) => ({ ...h, kind: "skill" as const })),
    ...responsibilityLines.map((r, i) => ({
      id: `R${hardSkills.length + i + 1}`,
      name: r,
      importance: "required" as const,
      sourceText: r,
      kind: "responsibility" as const
    })),
    ...educationRequirements.map((e, i) => ({
      id: `R${hardSkills.length + responsibilityLines.length + i + 1}`,
      name: e,
      importance: "required" as const,
      sourceText: e,
      kind: "education" as const
    }))
  ];

  return {
    jobTitle,
    seniority,
    senioritySpecified,
    requiredYears,
    yearsSpecified,
    hardSkills,
    responsibilities: responsibilityLines,
    educationRequirements,
    certificationRequirements,
    keywords,
    softSkills,
    atomicRequirements
  };
}
