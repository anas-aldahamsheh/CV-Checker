import { describe, expect, it } from "vitest";
import { jobRequirementsSchema } from "@/ai/schemas/extraction";

const base = { jobTitle: "Senior Full-Stack Engineer", responsibilities: [], educationRequirements: [], certificationRequirements: [], keywords: [], softSkills: [] };

describe("job extraction schema", () => {
  it("normalizes category and importance wording instead of rejecting the extraction", () => {
    const job = jobRequirementsSchema.parse({
      ...base,
      hardSkills: [
        { id: "R1", name: "React", importance: "Required", sourceText: "React", category: "skill" },
        { id: "R2", name: "PostgreSQL", importance: "nice to have", sourceText: "PostgreSQL", category: "databases" }
      ]
    });
    expect(job.hardSkills.map((skill) => [skill.category, skill.importance])).toEqual([
      ["general", "required"],
      ["database", "preferred"]
    ]);
  });

  it("renumbers non-standard and duplicate requirement ids to unused R ids", () => {
    const requirement = (id: string, name: string) => ({ id, name, importance: "preferred", sourceText: name, kind: "skill" });
    const job = jobRequirementsSchema.parse({
      ...base,
      atomicRequirements: [requirement("R1", "React"), requirement("P1", "GraphQL"), requirement("R1", "AWS"), requirement("R3", "Kubernetes")]
    });
    expect(job.atomicRequirements?.map((item) => item.id)).toEqual(["R1", "R2", "R4", "R3"]);
  });
});

describe("matching schema", () => {
  it("maps seniority and match wording the model may use", async () => {
    const { matchingSchema } = await import("@/ai/schemas/extraction");
    const result = matchingSchema.parse({
      matches: [{ requirementId: "R1", status: "matched", evidenceStrength: "none", evidenceIds: [], reason: "Found", confidence: 0.8 }],
      seniorityAssessment: { candidateLevel: "Senior", jobRequiredLevel: "Senior", status: "supported", reason: "Aligned" }
    });
    expect(result.matches[0]).toMatchObject({ status: "supported", evidenceStrength: "no_evidence" });
    expect(result.seniorityAssessment?.status).toBe("matched");
  });
});
