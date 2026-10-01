import type {
  AnalysisResult,
  JobMatchDetails,
  JobRequirement,
  JobRequirements,
  Recommendation,
  RequirementMatch,
  ResumeEvidence,
  ResumeHealthDetails
} from "@/ats/contracts/analysis";
import { includesTerm, normalizeTerm } from "@/ats/normalization/text";
import {
  achievementQuality,
  assessParseability,
  assessResumeHealth,
  parsedExperienceMonths,
  sectionStructure
} from "@/ats/checks/resume-checks";
import {
  calculateAtsScore,
  calculateConfidence,
  calculateJobMatchScore,
  calculateResumeQuality,
  weightedCoverage
} from "@/ats/scoring/score";

function meaningfulOverlap(left: string, right: string) {
  const leftTerms = left.toLowerCase().match(/[a-z]{3,}|[\u0600-\u06ff]{3,}/g) ?? [];
  const rightText = right.toLowerCase();
  return leftTerms.some((term) => rightText.includes(term));
}

function jobRequirements(job: JobRequirements): JobRequirement[] {
  if (job.atomicRequirements && job.atomicRequirements.length > 0) {
    return job.atomicRequirements;
  }
  const start = job.hardSkills.map((item) => ({ ...item, kind: "skill" as const }));
  let index = start.length;
  const append = (values: string[], kind: JobRequirement["kind"]) =>
    values.map((name) => ({ id: `R${++index}`, name, importance: "required" as const, sourceText: name, kind }));
  return [
    ...start,
    ...append(job.responsibilities, "responsibility"),
    ...append(job.educationRequirements, "education"),
    ...append(job.certificationRequirements, "certification")
  ];
}

export function deterministicMatches(resume: ResumeEvidence, requirements: JobRequirement[]): RequirementMatch[] {
  return requirements.map((requirement) => {
    const evidence = resume.evidenceItems.filter((item) => includesTerm(item.text, requirement.name));
    const direct = requirement.kind === "skill" ? resume.skills.some((skill) => includesTerm(skill, requirement.name)) : false;
    const education = requirement.kind === "education" ? resume.education.some((item) => meaningfulOverlap(item, requirement.name)) : false;
    const certification = requirement.kind === "certification" ? resume.certifications.some((item) => meaningfulOverlap(item, requirement.name)) : false;

    const inSkillsOnly = direct && evidence.length === 0;
    const supported = evidence.length >= 1 || education || certification;
    const partial = !supported && inSkillsOnly;

    let evidenceStrength: RequirementMatch["evidenceStrength"] = "no_evidence";
    let evidenceMultiplier = 0.0;

    if (evidence.length >= 2) {
      evidenceStrength = "strong";
      evidenceMultiplier = 1.0;
    } else if (evidence.length === 1 || education || certification) {
      evidenceStrength = "moderate";
      evidenceMultiplier = 0.75;
    } else if (inSkillsOnly) {
      evidenceStrength = "keyword_only";
      evidenceMultiplier = 0.2;
    } else if (direct) {
      evidenceStrength = "weak";
      evidenceMultiplier = 0.4;
    }

    const status = supported ? "supported" : partial ? "partial" : "not_found";

    return {
      requirementId: requirement.id,
      status,
      evidenceStrength,
      evidenceMultiplier,
      evidenceIds: evidence.map((item) => item.id),
      reason: supported
        ? "Supported by supplied resume evidence."
        : partial
        ? "Listed in skills section without practical work evidence."
        : "No supporting evidence was found in the supplied resume.",
      confidence: supported ? 0.9 : partial ? 0.7 : 0.9
    };
  });
}

function generateRecommendations(
  resume: ResumeEvidence,
  job: JobRequirements | null,
  components: AnalysisResult["components"],
  matches: RequirementMatch[],
  requirements: JobRequirement[],
  healthDetails: ResumeHealthDetails,
  jobMatchDetails: JobMatchDetails | null,
  locale: "ar" | "en"
): Recommendation[] {
  const ar = locale === "ar";
  const list: Recommendation[] = [];

  // 1. Missing Contact Details (Excludes items with labels detected)
  if (healthDetails.contact.missingFields.length > 0) {
    const missingNames = ar
      ? healthDetails.contact.arabicMissingFields.join(" و ")
      : healthDetails.contact.missingFields.join(" and ");
    const missingList = ar
      ? healthDetails.contact.arabicMissingFields.join("، ")
      : healthDetails.contact.missingFields.join(", ");

    list.push({
      priority: "high",
      title: ar ? `أضف ${missingNames}` : `Add ${missingNames}`,
      reason: ar
        ? `لم يتم العثور على: (${missingList}) في قسم معلومات التواصل، مما يصعب وصول مسؤولي التوظيف إليك.`
        : `Missing from contact details: (${missingList}). Recruiters need these to reach out.`,
      action: ar
        ? "أضف هذه الحقول في رأس السيرة الذاتية بشكل واضح ومباشر."
        : "Add accurate contact details at the top of your resume."
    });
  }

  // 2. Unverified Hyperlinks (Label present but URL unverified)
  if (healthDetails.contact.unverifiedFields && healthDetails.contact.unverifiedFields.length > 0) {
    const unverifiedList = ar
      ? healthDetails.contact.arabicUnverifiedFields?.join("، ")
      : healthDetails.contact.unverifiedFields.join(", ");
    list.push({
      priority: "medium",
      title: ar ? "تأكد من إدراج الرابط التشعبي بشكل نشط" : "Verify embedded hyperlinks",
      reason: ar
        ? `تم اكتشاف اسم الحساب (${unverifiedList})، ولكن لم نتمكن من قراءة الرابط الإلكتروني الفعلي.`
        : `Detected platform label (${unverifiedList}), but the embedded URL could not be resolved automatically.`,
      action: ar
        ? "تأكد من إدراج الرابط التشعبي كرابط نشط في ملف الـ PDF أو كتابة الرابط كاملاً لسهولة وصول مسؤولي التوظيف."
        : "Ensure the active URL is embedded as a valid hyperlink or written in full in your resume header."
    });
  }

  // 3. Parseability & Formatting
  if (components.parseability < 0.6) {
    list.push({
      priority: "high",
      title: ar ? "حسّن قابلية قراءة الملف" : "Improve parseability",
      reason: ar ? "النص المستخرج محدود أو قد يكون الملف ممسوحاً ضوئياً كصورة." : "The extracted text is limited or likely scanned.",
      action: ar ? "ارفع نسخة PDF نصية أو DOCX أو TXT من السيرة." : "Upload a text-based PDF, DOCX, or TXT version of the resume."
    });
  }

  // 4. Reverse Chronological Order
  if (!healthDetails.isChronological) {
    list.push({
      priority: "medium",
      title: ar ? "رتّب الخبرات من الأحدث إلى الأقدم" : "Order roles in reverse chronological order",
      reason: ar
        ? (healthDetails.chronologicalIssue ?? "تنسيق ATS القياسي يفضل دائماً وضع أحدث وظيفة في المقدمة.")
        : (healthDetails.chronologicalIssue ?? "Standard ATS format prefers your latest role at the top."),
      action: ar
        ? "أعد ترتيب الخبرات بحيث تبدأ بوظيفتك الحالية أو الأحدث نزولاً إلى الأقدم."
        : "Reorder your experience section starting with your most recent position."
    });
  }

  // 5. Timeline Gaps
  if (healthDetails.timelineGaps.length > 0) {
    const gap = healthDetails.timelineGaps[0];
    list.push({
      priority: "medium",
      title: ar ? "توضيح فجوة زمنية في الخبرة" : "Clarify employment timeline gap",
      reason: ar
        ? `توجد فجوة زمنية تبلغ ${gap.months} شهراً بين (${gap.start}) و (${gap.end}).`
        : `Detected an employment gap of ${gap.months} months between ${gap.start} and ${gap.end}.`,
      action: ar
        ? "يمكنك توضيح هذه الفترة بمشاريع مستقلة، دورات، أو مهارات تم اكتسابها لتجنب تساؤل مسؤولي التوظيف."
        : "Consider adding freelance projects, certifications, or self-directed learning to explain this gap."
    });
  }

  // 6. Ghost Skills (Listed with zero evidence in roles/projects)
  if (healthDetails.ghostSkills.length > 0) {
    const sample = healthDetails.ghostSkills.slice(0, 3).join(ar ? "، " : ", ");
    list.push({
      priority: "medium",
      title: ar ? "ادعم مهاراتك بأدلة عملية" : "Support listed skills with evidence",
      reason: ar
        ? `المهارات التالية مذكورة في قائمة المهارات دون أي ذكر لتطبيقها الفعلي في الخبرات أو المشاريع: (${sample}).`
        : `These skills appear in your skills list without any mention in experience or project bullets: (${sample}).`,
      action: ar
        ? "اذكر كيف استخدمت هذه المهارات في مهامك أو مشاريعك لإثبات امتلاكك لها فعلياً."
        : "Add bullet points illustrating how you applied these skills to achieve tangible results."
    });
  }

  // 7. Missing Required Job Requirements (Must-haves)
  if (job && jobMatchDetails && jobMatchDetails.missingMustHaves.length > 0) {
    const missingSample = jobMatchDetails.missingMustHaves.slice(0, 3).join(ar ? "، " : ", ");
    list.push({
      priority: "high",
      title: ar ? "عالج متطلبات الوظيفة الإلزامية الناقصة" : "Address missing required qualifications",
      reason: ar
        ? `هناك متطلبات إلزامية للوظيفة لم يُعثر على دليل عليها في سيرتك: (${missingSample}).`
        : `Critical required qualifications have no supporting evidence in your resume: (${missingSample}).`,
      action: ar
        ? "إذا كانت لديك هذه الخبرة، أضفها بصراحة في خبراتك أو مشاريعك قبل التقديم."
        : "If you have this experience, explicitly document it in your roles or projects before applying."
    });
  }

  // 8. Achievement & Metric Quality
  if (components.achievements < 0.55) {
    const achDetails = healthDetails.achievementDetails;
    const topRole = resume.roles[0]?.company || resume.roles[0]?.title || "";
    const roleMention = topRole ? (ar ? ` في (${topRole})` : ` in ${topRole}`) : "";

    const customReason = achDetails?.explanation
      ? achDetails.explanation
      : ar
      ? `معظم النقاط${roleMention} تسرد مسؤوليات ومهام روتينية بدلاً من نتائج ملموسة أو مقاييس أداء قابلة للقياس.`
      : `Most bullets${roleMention} describe routine responsibilities rather than measurable outcomes or concrete impact.`;

    const customAction = ar
      ? "أضف أبعاد الحجم أو السرعة أو الجودة وسرعة التسليم إذا كانت متوفرة لديك بدقة—مثل حجم التقييمات، تحسينات الأداء، أو دقة النتائج دون اختراع أرقام غير مؤكدة."
      : "Add scale, throughput, accuracy, turnaround time, or delivery outcomes where accurate—such as volume processed, accuracy achieved, or workflow improvements—without inventing figures.";

    list.push({
      priority: "medium",
      title: ar ? "عزز صياغة الإنجازات والنتائج" : "Strengthen achievement outcomes",
      reason: customReason,
      action: customAction
    });
  }

  // 9. Standard Sections
  if (components.sections < 0.6) {
    list.push({
      priority: "high",
      title: ar ? "استخدم أقساماً قياسية واضحة" : "Use standard resume sections",
      reason: ar ? "لم يتم اكتشاف بعض أقسام ATS الرئيسية بشكل واضح." : "Some standard sections could not be confirmed.",
      action: ar ? "تأكد من وجود أقسام واضحة للملخص، الخبرة، المهارات، والتعليم." : "Ensure clear headings for Summary, Experience, Skills, and Education."
    });
  }

  if (!list.length) {
    list.push({
      priority: "optional",
      title: ar ? "سيرتك الذاتية في حالة ممتازة" : "Resume is in excellent health",
      reason: ar ? "لم يتم اكتشاف أي فجوات هيكلية أو مشاكل تنسيق بارزة." : "No significant structural or formatting gaps detected.",
      action: ar ? "حافظ على تحديث بياناتك دورياً وتخصيص الملخص لكل وظيفة تتقدم إليها." : "Keep evidence updated and tailor your summary for each specific application."
    });
  }

  return list;
}

export function buildAnalysis(input: {
  resume: ResumeEvidence;
  job: JobRequirements | null;
  resumeText: string;
  parseHint?: Partial<AnalysisResult["parse"]>;
  provider: AnalysisResult["provider"];
  matches?: RequirementMatch[];
  seniorityAssessment?: {
    candidateLevel: string | null;
    jobRequiredLevel: string | null;
    status: "matched" | "underqualified" | "overqualified" | "unspecified";
    reason: string;
    specified?: boolean;
  };
  locale?: "ar" | "en";
}): AnalysisResult {
  const parse = assessParseability(input.resumeText, input.parseHint);
  const healthDetails = assessResumeHealth(input.resume, input.resumeText);
  const requirements = input.job ? jobRequirements(input.job) : [];
  const matches = input.matches ?? deterministicMatches(input.resume, requirements);

  const hardRequirements = requirements.filter((item) => item.kind === "skill");
  const responsibilityRequirements = requirements.filter((item) => item.kind === "responsibility");
  const hardSkills = weightedCoverage(hardRequirements, matches);
  const responsibilityCoverage = weightedCoverage(responsibilityRequirements, matches);

  // Semantic keyword coverage
  const keywordCoverage = input.job
    ? input.job.keywords.length
      ? input.job.keywords.filter((keyword) => {
          const normKey = normalizeTerm(keyword);
          return (
            includesTerm(input.resumeText, keyword) ||
            input.resume.skills.some((s) => normalizeTerm(s) === normKey) ||
            input.resume.evidenceItems.some((e) => normalizeTerm(e.text).includes(normKey))
          );
        }).length / input.job.keywords.length
      : 1
    : null;

  const titleMatch = input.job
    ? [input.job.jobTitle, input.job.seniority].filter(Boolean).some((term) => includesTerm(input.resumeText, term ?? ""))
    : false;

  const semanticSignals = (hardRequirements.length ? hardSkills * 0.6 : 0) + (responsibilityRequirements.length ? responsibilityCoverage * 0.4 : 0);
  const roleAlignment = input.job
    ? titleMatch
      ? 1
      : hardRequirements.length || responsibilityRequirements.length
      ? Math.min(0.9, 0.15 + semanticSignals * 0.75)
      : 0.35
    : null;

  const experienceMonths = parsedExperienceMonths(input.resume);
  const yearsSpecified = input.job?.yearsSpecified ?? Boolean(input.job?.requiredYears);
  const experience = !input.job || !yearsSpecified
    ? null
    : experienceMonths === null
    ? 0.35
    : Math.min(1, experienceMonths / ((input.job.requiredYears || 1) * 12));

  const educationRequirements = requirements.filter((item) => item.kind === "education" || item.kind === "certification");

  const components = {
    parseability: parse.status === "good" ? 1 : parse.status === "limited" ? 0.45 : 0,
    contact: healthDetails.contact.score,
    sections: sectionStructure(input.resume),
    roleAlignment,
    hardSkills,
    experience,
    keywords: keywordCoverage,
    achievements: achievementQuality(input.resume),
    educationCertification: educationRequirements.length ? weightedCoverage(educationRequirements, matches) : null
  };

  const score = input.job && parse.usefulText ? calculateAtsScore(components) : null;
  const jobMatchScore = input.job && parse.usefulText ? calculateJobMatchScore(components) : null;

  // Compute detailed job match breakdown
  let jobMatchDetails: JobMatchDetails | null = null;
  if (input.job) {
    const mustHaveRequirements = requirements.filter((r) => r.importance === "required");
    const niceToHaveRequirements = requirements.filter((r) => r.importance === "preferred");

    const mustHaveCoverage = mustHaveRequirements.length
      ? Math.round(weightedCoverage(mustHaveRequirements, matches) * 100)
      : 100;

    const niceToHaveCoverage = niceToHaveRequirements.length
      ? Math.round(weightedCoverage(niceToHaveRequirements, matches) * 100)
      : 100;

    const missingMustHaves = mustHaveRequirements
      .filter((r) => matches.find((m) => m.requirementId === r.id)?.status === "not_found")
      .map((r) => r.name);

    const missingNiceToHaves = niceToHaveRequirements
      .filter((r) => matches.find((m) => m.requirementId === r.id)?.status === "not_found")
      .map((r) => r.name);

    const senioritySpecified = input.job.senioritySpecified ?? Boolean(input.job.seniority);
    const seniorityMatch = input.seniorityAssessment ?? {
      candidateLevel: input.resume.seniorityEstimate ?? null,
      jobRequiredLevel: input.job.seniority ?? null,
      status: senioritySpecified ? ("matched" as const) : ("unspecified" as const),
      reason: senioritySpecified ? "Seniority aligned." : "The job description does not explicitly specify a seniority requirement.",
      specified: senioritySpecified
    };

    jobMatchDetails = {
      overallScore: jobMatchScore ?? 0,
      mustHaveCoverage,
      niceToHaveCoverage,
      seniorityMatch,
      missingMustHaves,
      missingNiceToHaves
    };
  }

  const recommendations = generateRecommendations(
    input.resume,
    input.job,
    components,
    matches,
    requirements,
    healthDetails,
    jobMatchDetails,
    input.locale ?? "en"
  );

  return {
    mode: input.job ? "job-match" : "resume-only",
    score,
    jobMatchScore,
    resumeQuality: calculateResumeQuality(components),
    confidence: parse.status === "scanned" ? 0 : calculateConfidence(components.parseability, Boolean(input.job), input.resume.evidenceItems.length, input.provider),
    parse,
    components,
    resume: input.resume,
    job: input.job,
    requirements,
    matches,
    recommendations,
    healthDetails,
    jobMatchDetails,
    provider: input.provider
  };
}
