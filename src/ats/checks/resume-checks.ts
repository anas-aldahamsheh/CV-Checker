import type {
  AchievementDetails,
  BulletAchievement,
  ContactDetailsReport,
  ParseReport,
  ResumeEvidence,
  ResumeHealthDetails
} from "@/ats/contracts/analysis";
import { checkReverseChronologicalOrder, detectEmploymentGaps, totalRoleMonths } from "./date-math";
import { normalizeTerm } from "@/ats/normalization/text";

const standardSections = ["summary", "experience", "education", "skills", "projects"];
const action =
  /\b(led|built|managed|created|improved|developed|designed|delivered|implemented|launched|analyzed|automated|increased|reduced|engineered|architected|spearheaded|orchestrated)\b|(?:قمت|طورت|أدرت|صممت|أنشأت|حسنت|نفذت|هندست|بنيت)/i;
const metricPattern =
  /(?:\d+[%+]|\$\s?\d+|\b\d+\s*(?:users|clients|hours|days|projects|engineers|teams|x|ms|s)\b)/i;

export function assessParseability(text: string, parser?: Partial<ParseReport>): ParseReport {
  const normalized = text.replace(/\s+/g, " ").trim();
  const unusual = (normalized.match(/[^\p{L}\p{N}\s.,;:()@+\-_/&]/gu) ?? []).length;
  const garbageRatio = normalized.length ? unusual / normalized.length : 1;
  const longUnbrokenText = normalized.length > 1_200 && !/\n/.test(text);
  const warnings = [...(parser?.warnings ?? [])];
  if (normalized.length < 80) warnings.push("Very little text was extracted; this document may be scanned or image-only.");
  if (garbageRatio > 0.2) warnings.push("Extracted text contains excessive symbol noise.");
  if (longUnbrokenText) warnings.push("Text appears as one long block and reading order may be unreliable.");
  const status =
    normalized.length < 80 ? "scanned" : garbageRatio > 0.2 || longUnbrokenText || parser?.status === "limited" ? "limited" : "good";
  return { status, characterCount: normalized.length, warnings: [...new Set(warnings)], usefulText: normalized.length >= 80, garbageRatio, longUnbrokenText };
}

export function assessContactDetails(resume: ResumeEvidence): ContactDetailsReport {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const rawEmail = resume.candidate.email?.trim() ?? "";
  const hasEmail = Boolean(rawEmail && (emailRegex.test(rawEmail) || rawEmail.includes("@")));

  const rawPhone = resume.candidate.phone?.trim() ?? "";
  const digitsOnly = rawPhone.replace(/\D/g, "");
  const hasPhone = Boolean(rawPhone && digitsOnly.length >= 7);

  // Semantic location detection
  const rawLocation = resume.candidate.location?.trim() ?? "";
  const locStatus = resume.candidate.locationStatus;
  const hasLocation = Boolean(
    (locStatus && locStatus !== "missing") ||
    (rawLocation && rawLocation.length >= 2)
  );

  // Semantic links & label detection
  const hasExplicitLinks = Boolean(resume.candidate.links && resume.candidate.links.length > 0);
  const linksDetails = resume.candidate.linksDetails;

  const linkedIn = linksDetails?.linkedin;
  const github = linksDetails?.github;
  const portfolio = linksDetails?.portfolio;

  const anyLabelDetected = Boolean(
    linkedIn?.labelDetected ||
    github?.labelDetected ||
    portfolio?.labelDetected
  );

  const anyUrlVerified = Boolean(
    hasExplicitLinks ||
    linkedIn?.urlDetected ||
    github?.urlDetected ||
    portfolio?.urlDetected
  );

  const hasLinks = anyUrlVerified || anyLabelDetected;

  const rawName = resume.candidate.name?.trim() ?? "";
  const hasName = Boolean(rawName && rawName.length >= 2);

  const missingFields: string[] = [];
  const arabicMissingFields: string[] = [];
  const unverifiedFields: string[] = [];
  const arabicUnverifiedFields: string[] = [];

  if (!hasEmail) {
    missingFields.push("Email address");
    arabicMissingFields.push("البريد الإلكتروني");
  }
  if (!hasPhone) {
    missingFields.push("Phone number");
    arabicMissingFields.push("رقم الهاتف");
  }

  // Handle links fail-safe: Never say missing if label is present!
  if (!hasLinks) {
    missingFields.push("LinkedIn or professional portfolio link");
    arabicMissingFields.push("رابط حساب LinkedIn أو معرض الأعمال المهني");
  } else if (!anyUrlVerified && anyLabelDetected) {
    if (linkedIn?.labelDetected && !linkedIn?.urlDetected) {
      unverifiedFields.push("LinkedIn hyperlink unverified");
      arabicUnverifiedFields.push("اسم LinkedIn موجود ولكن الرابط التشعبي غير مفحوص");
    }
    if (github?.labelDetected && !github?.urlDetected) {
      unverifiedFields.push("GitHub hyperlink unverified");
      arabicUnverifiedFields.push("اسم GitHub موجود ولكن الرابط التشعبي غير مفحوص");
    }
  }

  if (!hasLocation) {
    missingFields.push("City / Location");
    arabicMissingFields.push("المدينة أو الموقع الجغرافي");
  }

  const coreCount = [
    hasEmail ? 1 : 0,
    hasPhone ? 1 : 0,
    anyUrlVerified ? 1 : anyLabelDetected ? 0.8 : 0,
    hasLocation ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const score = coreCount / 4;

  return {
    hasName,
    hasEmail,
    hasPhone,
    hasLocation,
    locationStatus: hasLocation ? "present" : "missing",
    hasLinks,
    linksStatus: anyUrlVerified ? "verified" : anyLabelDetected ? "label_present_url_unverified" : "missing",
    linksDetails,
    missingFields,
    arabicMissingFields,
    unverifiedFields,
    arabicUnverifiedFields,
    score
  };
}

export function contactCompleteness(resume: ResumeEvidence): number {
  return assessContactDetails(resume).score;
}

export function sectionStructure(resume: ResumeEvidence): number {
  const sections = resume.detectedSections;
  const summaryPresent = sections?.summary?.present ?? Boolean(resume.summary && resume.summary.length > 0);
  const experiencePresent = sections?.experience?.present ?? Boolean(resume.roles.length > 0);
  const educationPresent = sections?.education?.present ?? Boolean(resume.education.length > 0);
  const skillsPresent = sections?.skills?.present ?? Boolean(resume.skills.length > 0);
  const projectsPresent = sections?.projects?.present ?? Boolean(resume.projects.length > 0);

  const presentCount = [
    summaryPresent,
    experiencePresent,
    educationPresent,
    skillsPresent,
    projectsPresent
  ].filter(Boolean).length;

  return presentCount / standardSections.length;
}

export function detectGhostSkills(resume: ResumeEvidence): string[] {
  if (!resume.skills.length) return [];
  const corpus = [
    ...resume.roles.flatMap((r) => [r.title, ...r.bullets]),
    ...resume.projects,
    resume.summary
  ]
    .join(" ")
    .toLowerCase();

  return resume.skills.filter((skill) => {
    const clean = skill.trim().toLowerCase();
    if (clean.length < 2) return false;
    const cleanNorm = normalizeTerm(clean);
    return !corpus.includes(clean) && !normalizeTerm(corpus).includes(cleanNorm);
  });
}

export function scoreBullet(bullet: BulletAchievement): number {
  let base = 0.0;
  switch (bullet.classification) {
    case "strong_achievement":
      base = 1.0;
      break;
    case "moderate_achievement":
      base = 0.7;
      break;
    case "weak_achievement":
      base = 0.35;
      break;
    case "responsibility_duty":
      base = 0.1;
      break;
    case "descriptive":
    default:
      base = 0.0;
      break;
  }

  let bonus = 0.0;
  if (bullet.metricPresent || (bullet.metrics && bullet.metrics.length > 0)) {
    bonus += 0.15;
  }
  if (bullet.hasClearOutcome) {
    bonus += 0.1;
  }
  if (bullet.ownershipStrength === "high") {
    bonus += 0.05;
  }

  return Math.min(1.0, Math.round((base + bonus) * 100) / 100);
}

const outcomeWords =
  /\b(replaced|automated|delivered|launched|increased|reduced|scaled|improved|boosted|accelerated|streamlined|resolved|solved|eliminated|designed|architected|spearheaded)\b|(?:استبدال|أتمتة|تقليص|تخفيض|تحسين|تسريع|إطلاق|تصميم|هندسة)/i;
const dutyWords =
  /\b(responsible for|responsible|assist|assisted|support|supported|participate|participated|evaluate|evaluating|monitored|monitoring|daily duties|tasked with)\b|(?:مسؤول عن|مساعدة|دعم|مشاركة|متابعة|تقييم)/i;

export function evaluateAchievements(resume: ResumeEvidence): AchievementDetails {
  // If LLM has evaluated bullet achievements, use them
  if (resume.bulletAchievements && resume.bulletAchievements.length > 0) {
    const scoredBullets = resume.bulletAchievements.map((b) => ({
      ...b,
      score: scoreBullet(b)
    }));

    const strongCount = scoredBullets.filter((b) => b.classification === "strong_achievement").length;
    const moderateCount = scoredBullets.filter((b) => b.classification === "moderate_achievement").length;
    const weakCount = scoredBullets.filter((b) => b.classification === "weak_achievement").length;
    const dutyCount = scoredBullets.filter((b) => b.classification === "responsibility_duty").length;
    const metricsCount = scoredBullets.filter((b) => b.metricPresent || b.metrics.length > 0).length;

    const totalScore = scoredBullets.reduce((sum, b) => sum + (b.score ?? 0), 0);
    const avgScore = scoredBullets.length > 0 ? totalScore / scoredBullets.length : 0;

    let explanation = resume.achievementExplanation ?? "";
    if (!explanation) {
      if (strongCount > 0 || moderateCount > 0) {
        explanation = `Detected ${strongCount} strong achievement(s) and ${moderateCount} moderate achievement(s) with tangible operational impact.`;
      } else if (dutyCount > 0) {
        explanation = "Most bullets describe responsibilities and duties rather than measurable impact or explicit outcomes.";
      } else {
        explanation = "No verifiable achievement or outcome statements detected in roles or projects.";
      }
    }

    return {
      score: Math.min(1.0, Math.round(avgScore * 100) / 100),
      strongCount,
      moderateCount,
      weakCount,
      dutyCount,
      metricsCount,
      totalBulletsCount: scoredBullets.length,
      explanation,
      bullets: scoredBullets
    };
  }

  // Fallback: Rule-assisted evaluation for offline/fallback mode
  const rawBullets = [
    ...resume.roles.flatMap((r) => r.bullets),
    ...resume.projects
  ].filter(Boolean);

  if (!rawBullets.length) {
    return {
      score: 0,
      strongCount: 0,
      moderateCount: 0,
      weakCount: 0,
      dutyCount: 0,
      metricsCount: 0,
      totalBulletsCount: 0,
      explanation: "No bullet points found in experience or projects.",
      bullets: []
    };
  }

  const evaluatedBullets: BulletAchievement[] = rawBullets.map((text) => {
    const hasMetric = metricPattern.test(text);
    const hasOutcome = outcomeWords.test(text);
    const hasDuty = dutyWords.test(text);
    const hasAction = action.test(text);

    let classification: BulletAchievement["classification"] = "responsibility_duty";
    let ownership: BulletAchievement["ownershipStrength"] = "medium";
    let evidence: BulletAchievement["evidenceStrength"] = "weak";

    if (hasMetric && hasOutcome) {
      classification = "strong_achievement";
      ownership = "high";
      evidence = "strong";
    } else if (hasOutcome || (hasAction && !hasDuty)) {
      classification = "moderate_achievement";
      ownership = "high";
      evidence = "moderate";
    } else if (hasDuty) {
      classification = "responsibility_duty";
      ownership = "low";
      evidence = "none";
    } else {
      classification = "weak_achievement";
      ownership = "medium";
      evidence = "weak";
    }

    const metrics: Array<{ type: string; value: string }> = [];
    if (hasMetric) {
      const match = text.match(metricPattern);
      if (match) metrics.push({ type: "quantitative", value: match[0] });
    }

    const item: BulletAchievement = {
      text,
      classification,
      metricPresent: hasMetric,
      metrics,
      impactTypes: hasOutcome ? ["operational delivery", "impact"] : ["duty"],
      ownershipStrength: ownership,
      evidenceStrength: evidence,
      hasClearOutcome: hasOutcome,
      reasoningSummary: hasOutcome
        ? "Demonstrates practical delivery and outcome."
        : "Describes ongoing responsibilities."
    };

    return {
      ...item,
      score: scoreBullet(item)
    };
  });

  const strongCount = evaluatedBullets.filter((b) => b.classification === "strong_achievement").length;
  const moderateCount = evaluatedBullets.filter((b) => b.classification === "moderate_achievement").length;
  const weakCount = evaluatedBullets.filter((b) => b.classification === "weak_achievement").length;
  const dutyCount = evaluatedBullets.filter((b) => b.classification === "responsibility_duty").length;
  const metricsCount = evaluatedBullets.filter((b) => b.metricPresent).length;

  const total = evaluatedBullets.reduce((s, b) => s + (b.score ?? 0), 0);
  const avg = total / evaluatedBullets.length;

  return {
    score: Math.min(1.0, Math.round(avg * 100) / 100),
    strongCount,
    moderateCount,
    weakCount,
    dutyCount,
    metricsCount,
    totalBulletsCount: evaluatedBullets.length,
    explanation:
      strongCount > 0 || moderateCount > 0
        ? `Recognized ${strongCount + moderateCount} achievement(s) across experience bullets.`
        : "Bullets describe responsibilities and activities with limited measurable outcomes.",
    bullets: evaluatedBullets
  };
}

export function achievementQuality(resume: ResumeEvidence): number {
  return evaluateAchievements(resume).score;
}

export function parsedExperienceMonths(resume: ResumeEvidence): number | null {
  return totalRoleMonths(resume.roles);
}

export function assessResumeHealth(resume: ResumeEvidence, resumeText: string): ResumeHealthDetails {
  const contact = assessContactDetails(resume);
  const timelineGaps = detectEmploymentGaps(resume.roles);
  const ghostSkills = detectGhostSkills(resume);
  const chrono = checkReverseChronologicalOrder(resume.roles);
  const achievements = evaluateAchievements(resume);

  const words = resumeText.trim().split(/\s+/).filter(Boolean).length;
  const estimatedPages = Math.max(1, Math.ceil(words / 450));

  const allBullets = resume.roles.flatMap((r) => r.bullets);
  const totalBulletsCount = achievements.totalBulletsCount || allBullets.length;
  const strongActionBulletsCount = allBullets.filter((b) => action.test(b)).length;

  // Base intrinsic health score out of 100
  let score = 0;
  score += contact.score * 20;
  score += sectionStructure(resume) * 25;
  score += Math.min(1, words >= 180 && words <= 1200 ? 1 : 0.6) * 20;
  score += achievements.score * 25;
  if (chrono.isChronological) score += 10;

  return {
    score: Math.min(100, Math.round(score)),
    contact,
    timelineGaps,
    ghostSkills,
    wordCount: words,
    estimatedPages,
    isChronological: chrono.isChronological,
    chronologicalIssue: chrono.issue ?? null,
    metricsCount: achievements.metricsCount,
    strongActionBulletsCount,
    totalBulletsCount,
    achievementDetails: achievements
  };
}
