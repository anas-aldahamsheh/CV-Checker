import { describe, expect, it } from "vitest";
import { evaluateAchievements, scoreBullet } from "@/ats/checks/resume-checks";
import { buildAnalysis } from "@/ats/analysis/engine";
import { extractResumeFallback } from "@/ai/analysis/fallback";
import type { BulletAchievement, ResumeEvidence } from "@/ats/contracts/analysis";

describe("Achievement & Metrics Quality Semantic Evaluator", () => {
  describe("Bullet-level scoring formula (scoreBullet)", () => {
    it("scores a Strong Achievement with metrics and outcome at 1.0", () => {
      const bullet: BulletAchievement = {
        text: "Built an automated evaluation pipeline that reduced processing time from 2 days to 3 hours.",
        classification: "strong_achievement",
        metricPresent: true,
        metrics: [{ type: "time reduction", value: "from 2 days to 3 hours" }],
        impactTypes: ["efficiency", "automation"],
        ownershipStrength: "high",
        evidenceStrength: "strong",
        hasClearOutcome: true,
        reasoningSummary: "Shows high ownership, clear metric, and automated system delivery."
      };

      // Base 1.0 + metric 0.15 + outcome 0.10 + ownership 0.05 = 1.30 -> clamped to 1.0
      expect(scoreBullet(bullet)).toBe(1.0);
    });

    it("scores a qualitative achievement without numbers well above zero (>= 0.70)", () => {
      const bullet: BulletAchievement = {
        text: "Built an internal evaluation system that replaced a paid external evaluator.",
        classification: "moderate_achievement",
        metricPresent: false,
        metrics: [],
        impactTypes: ["system delivery", "cost reduction", "replacement"],
        ownershipStrength: "high",
        evidenceStrength: "moderate",
        hasClearOutcome: true,
        reasoningSummary: "Shows ownership and system replacement, though lacks exact quantified savings."
      };

      // Base 0.70 + outcome 0.10 + ownership 0.05 = 0.85
      const score = scoreBullet(bullet);
      expect(score).toBeGreaterThanOrEqual(0.7);
      expect(score).toBe(0.85);
    });

    it("scores a responsibility/duty bullet low but strictly non-zero (0.10 - 0.15)", () => {
      const dutyBullet: BulletAchievement = {
        text: "Evaluate model responses for accuracy and safety.",
        classification: "responsibility_duty",
        metricPresent: false,
        metrics: [],
        impactTypes: ["ongoing duty"],
        ownershipStrength: "medium",
        evidenceStrength: "none",
        hasClearOutcome: false,
        reasoningSummary: "Describes ongoing day-to-day role responsibilities without measurable outcome."
      };

      // Base 0.10 + 0 bonuses = 0.10
      const score = scoreBullet(dutyBullet);
      expect(score).toBe(0.1);
      expect(score).toBeGreaterThan(0);
    });

    it("scores descriptive/informational text at 0.0", () => {
      const descriptiveBullet: BulletAchievement = {
        text: "Member of the regional engineering guild.",
        classification: "descriptive",
        metricPresent: false,
        metrics: [],
        impactTypes: [],
        ownershipStrength: "low",
        evidenceStrength: "none",
        hasClearOutcome: false,
        reasoningSummary: "Informational background note."
      };

      expect(scoreBullet(descriptiveBullet)).toBe(0.0);
    });

    it("quantified evidence awards higher score than pure qualitative claim", () => {
      const qualitative: BulletAchievement = {
        text: "Built an automated evaluation pipeline that reduced manual review time.",
        classification: "moderate_achievement",
        metricPresent: false,
        metrics: [],
        impactTypes: ["automation", "efficiency"],
        ownershipStrength: "high",
        evidenceStrength: "moderate",
        hasClearOutcome: true
      };

      const quantified: BulletAchievement = {
        text: "Built an automated evaluation pipeline that reduced manual review time by 75%.",
        classification: "strong_achievement",
        metricPresent: true,
        metrics: [{ type: "time saved", value: "75%" }],
        impactTypes: ["automation", "efficiency"],
        ownershipStrength: "high",
        evidenceStrength: "strong",
        hasClearOutcome: true
      };

      expect(scoreBullet(quantified)).toBeGreaterThan(scoreBullet(qualitative));
    });
  });

  describe("Resume-level evaluation & Zero Score Rule", () => {
    it("never assigns 0% when a resume contains duties or ownership signals", () => {
      const resumeText = `
Anas Aldahamsheh
Amman | +962 789 495 167 | anas@example.com | https://linkedin.com/in/anas
Summary
AI Engineer specializing in LLM evaluation.
Experience
AI Evaluation Specialist | ITC International | 2023 - Present
• Evaluate model responses for accuracy and safety.
• Review hallucination rates and annotate conversational datasets.
• Support engineering teams with model feedback reports.
Skills
Python, Evaluation, Prompt Engineering
Education
B.Sc. in Computer Engineering
      `;

      const evidence = extractResumeFallback(resumeText);
      const achievementDetails = evaluateAchievements(evidence);

      // Even with no explicit % numbers, score must NOT be 0!
      expect(achievementDetails.score).toBeGreaterThan(0);
      expect(achievementDetails.totalBulletsCount).toBeGreaterThan(0);
      expect(achievementDetails.explanation).toBeTruthy();
      // Explanation should explain why score is modest rather than pretending 0 achievements exist
      expect(achievementDetails.explanation).not.toContain("0% failure");
    });

    it("evaluates diverse non-percentage metrics (counts, volume, latency, throughput, scale)", () => {
      const bullets: BulletAchievement[] = [
        {
          text: "Processed 20,000 evaluations across 12 production models.",
          classification: "strong_achievement",
          metricPresent: true,
          metrics: [
            { type: "volume", value: "20,000 evaluations" },
            { type: "count", value: "12 models" }
          ],
          impactTypes: ["volume", "scale"],
          ownershipStrength: "high",
          evidenceStrength: "strong",
          hasClearOutcome: true
        },
        {
          text: "Supported 30+ concurrent users with sub-200ms latency.",
          classification: "strong_achievement",
          metricPresent: true,
          metrics: [
            { type: "concurrency", value: "30+ concurrent users" },
            { type: "latency", value: "sub-200ms" }
          ],
          impactTypes: ["concurrency", "speed"],
          ownershipStrength: "high",
          evidenceStrength: "strong",
          hasClearOutcome: true
        },
        {
          text: "Delivered 8,000 conversations in 2 days under tight client deadline.",
          classification: "strong_achievement",
          metricPresent: true,
          metrics: [
            { type: "volume", value: "8,000 conversations" },
            { type: "duration", value: "2 days" }
          ],
          impactTypes: ["delivery", "scale"],
          ownershipStrength: "high",
          evidenceStrength: "strong",
          hasClearOutcome: true
        }
      ];

      const mockEvidence: ResumeEvidence = {
        candidate: {
          name: "Test Engineer",
          email: "test@example.com",
          phone: "+962 789 495 167",
          location: "Amman",
          locationStatus: "present",
          links: ["https://linkedin.com/in/test"]
        },
        summary: "Senior AI Engineer",
        roles: [{
          title: "AI Engineer",
          company: "Tech Co",
          startDate: "2023",
          endDate: "Present",
          bullets: bullets.map((b) => b.text)
        }],
        skills: ["AI", "Evaluation"],
        education: ["BS Computer Science"],
        certifications: [],
        projects: [],
        evidenceItems: [],
        bulletAchievements: bullets,
        achievementExplanation: "Demonstrated high-scale evaluation volume, low-latency performance, and strict deadline delivery."
      };

      const result = evaluateAchievements(mockEvidence);
      expect(result.score).toBe(1.0);
      expect(result.strongCount).toBe(3);
      expect(result.metricsCount).toBe(3);
      expect(result.explanation).toContain("high-scale evaluation volume");
    });

    it("properly integrates into buildAnalysis and provides constructive, non-hallucinated recommendations", () => {
      const resumeText = `
Anas Aldahamsheh
Amman | +962 789 495 167 | anas@example.com | https://linkedin.com/in/anas
Summary
AI Engineer.
Experience
AI Specialist | ITC International | 2023 - Present
• Responsible for evaluating model responses and maintaining safety checks.
• Assisted team with test prompt writing and benchmark runs.
Skills
Prompt Engineering, Evaluation
Education
B.Sc.
      `;

      const evidence = extractResumeFallback(resumeText);
      const analysis = buildAnalysis({
        resume: evidence,
        job: null,
        resumeText,
        provider: "deterministic-fallback"
      });

      // Component achievement score should be > 0 and healthy
      expect(analysis.components.achievements).toBeGreaterThan(0);
      expect(analysis.resumeQuality).toBeGreaterThan(0);

      // Verify recommendations mention specific context and do NOT hallucinate fake numbers
      const achRec = analysis.recommendations.find(
        (r) => r.title.toLowerCase().includes("achievement") || r.title.toLowerCase().includes("إنجازات")
      );
      if (achRec) {
        expect(achRec.reason).not.toContain("40%");
        expect(achRec.reason).not.toContain("by 50%");
        expect(achRec.action).not.toContain("40%");
        expect(achRec.action).not.toContain("by 50%");
        expect(achRec.reason + " " + achRec.action).toMatch(/ITC International|scale|quality|volume|speed|throughput/i);
      }
    });
  });
});
