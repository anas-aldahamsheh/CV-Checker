export type Importance = "required" | "preferred";
export type MatchStatus = "supported" | "partial" | "not_found";
export type EvidenceStrength = "strong" | "moderate" | "weak" | "keyword_only" | "no_evidence" | "missing";
export type Priority = "high" | "medium" | "optional";

export type EvidenceItem = {
  id: string;
  text: string;
  sourceSection: "summary" | "experience" | "skills" | "education" | "certifications" | "projects" | "other";
};

export type ResumeRole = {
  title: string;
  company: string;
  startDate: string | null;
  endDate: string | null;
  bullets: string[];
};

export type CategorizedSkills = {
  languages: string[];
  frameworks: string[];
  cloud: string[];
  databases: string[];
  tools: string[];
  spokenLanguages: string[];
};

export type LinkStatus = "verified" | "label_present_url_unverified" | "missing";

export type LinkItem = {
  present: boolean;
  labelDetected: boolean;
  urlDetected: boolean;
  url: string | null;
  status: LinkStatus;
};

export type SectionDetectionItem = {
  present: boolean;
  detectedHeading: string | null;
};

export type DetectedSections = {
  summary: SectionDetectionItem;
  experience: SectionDetectionItem;
  education: SectionDetectionItem;
  skills: SectionDetectionItem;
  projects: SectionDetectionItem;
  certifications: SectionDetectionItem;
  languages: SectionDetectionItem;
};

export type BulletClassification =
  | "strong_achievement"
  | "moderate_achievement"
  | "weak_achievement"
  | "responsibility_duty"
  | "descriptive";

export type BulletAchievement = {
  text: string;
  classification: BulletClassification;
  metricPresent: boolean;
  metrics: Array<{ type: string; value: string }>;
  impactTypes: string[];
  ownershipStrength: "high" | "medium" | "low";
  evidenceStrength: "strong" | "moderate" | "weak" | "none";
  hasClearOutcome?: boolean;
  reasoningSummary?: string;
  score?: number;
};

export type AchievementDetails = {
  score: number;
  strongCount: number;
  moderateCount: number;
  weakCount: number;
  dutyCount: number;
  metricsCount: number;
  totalBulletsCount: number;
  explanation: string;
  bullets: BulletAchievement[];
};

export type ResumeEvidence = {
  candidate: {
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    links: string[];
    linksDetails?: {
      linkedin?: LinkItem;
      github?: LinkItem;
      portfolio?: LinkItem;
      website?: LinkItem;
    };
    locationStatus?: "present" | "missing" | "partially_present" | "ambiguous";
  };
  summary: string;
  seniorityEstimate?: string | null;
  roles: ResumeRole[];
  skills: string[];
  categorizedSkills?: CategorizedSkills;
  education: string[];
  certifications: string[];
  projects: string[];
  evidenceItems: EvidenceItem[];
  detectedSections?: Partial<DetectedSections>;
  bulletAchievements?: BulletAchievement[];
  achievementExplanation?: string;
};

export type JobRequirement = {
  id: string;
  name: string;
  importance: Importance;
  sourceText: string;
  kind: "skill" | "responsibility" | "education" | "certification" | "keyword" | "experience_duration" | "seniority" | "soft_skill";
  category?: "language" | "framework" | "cloud" | "database" | "tool" | "general";
  atomicDecomposition?: string[];
};

export type JobRequirements = {
  jobTitle: string;
  seniority: string | null;
  senioritySpecified?: boolean;
  requiredYears: number | null;
  yearsSpecified?: boolean;
  hardSkills: Array<Omit<JobRequirement, "kind">>;
  responsibilities: string[];
  educationRequirements: string[];
  certificationRequirements: string[];
  keywords: string[];
  softSkills: string[];
  atomicRequirements?: JobRequirement[];
};

export type RequirementMatch = {
  requirementId: string;
  status: MatchStatus;
  evidenceStrength?: EvidenceStrength;
  evidenceMultiplier?: number;
  evidenceIds: string[];
  reason: string;
  confidence: number;
};

export type ParseReport = {
  status: "good" | "limited" | "scanned" | "failed";
  characterCount: number;
  warnings: string[];
  usefulText: boolean;
  garbageRatio: number;
  longUnbrokenText: boolean;
};

export type AtsComponents = {
  parseability: number;
  contact: number;
  sections: number;
  roleAlignment: number | null;
  hardSkills: number;
  experience: number | null;
  keywords: number | null;
  achievements: number;
  educationCertification: number | null;
};

export type Recommendation = {
  priority: Priority;
  title: string;
  reason: string;
  action: string;
};

export type TimelineGap = {
  start: string;
  end: string;
  months: number;
};

export type ContactDetailsReport = {
  hasName: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasLocation: boolean;
  locationStatus?: "present" | "missing" | "partially_present" | "ambiguous";
  hasLinks: boolean;
  linksStatus?: LinkStatus;
  linksDetails?: {
    linkedin?: LinkItem;
    github?: LinkItem;
    portfolio?: LinkItem;
    website?: LinkItem;
  };
  missingFields: string[];
  arabicMissingFields: string[];
  unverifiedFields?: string[];
  arabicUnverifiedFields?: string[];
  score: number;
};

export type ResumeHealthDetails = {
  score: number;
  contact: ContactDetailsReport;
  timelineGaps: TimelineGap[];
  ghostSkills: string[];
  wordCount: number;
  estimatedPages: number;
  isChronological: boolean;
  chronologicalIssue?: string | null;
  metricsCount: number;
  strongActionBulletsCount: number;
  totalBulletsCount: number;
  achievementDetails?: AchievementDetails;
};

export type JobMatchDetails = {
  overallScore: number;
  mustHaveCoverage: number;
  niceToHaveCoverage: number;
  seniorityMatch: {
    candidateLevel: string | null;
    jobRequiredLevel: string | null;
    status: "matched" | "underqualified" | "overqualified" | "unspecified";
    reason: string;
    specified?: boolean;
  };
  missingMustHaves: string[];
  missingNiceToHaves: string[];
};

export type AnalysisResult = {
  mode: "job-match" | "resume-only";
  score: number | null;
  jobMatchScore?: number | null;
  resumeQuality: number;
  confidence: number;
  parse: ParseReport;
  components: AtsComponents;
  resume: ResumeEvidence;
  job: JobRequirements | null;
  requirements: JobRequirement[];
  matches: RequirementMatch[];
  recommendations: Recommendation[];
  provider: "gemini" | "deterministic-fallback";
  healthDetails?: ResumeHealthDetails;
  jobMatchDetails?: JobMatchDetails | null;
};
