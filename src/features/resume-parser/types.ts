import type { ParseReport } from "@/ats/contracts/analysis";

export type ResumeHyperlink = {
  url: string;
  label?: string;
};

export type ParsedResume = {
  fileName: string;
  fileType: "pdf" | "docx" | "txt";
  text: string;
  parse: ParseReport;
  hyperlinks?: ResumeHyperlink[];
};
