import mammoth from "mammoth";
import { assessParseability } from "@/ats/checks/resume-checks";
import type { ParsedResume, ResumeHyperlink } from "./types";

function validSignature(extension: ParsedResume["fileType"], bytes: Uint8Array) {
  if (extension === "pdf") return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (extension === "docx") return bytes[0] === 0x50 && bytes[1] === 0x4b;
  return true;
}

export async function parseResume(file: File, extension: ParsedResume["fileType"]): Promise<ParsedResume> {
  const bytes = await file.arrayBuffer();
  const data = new Uint8Array(bytes);
  if (!validSignature(extension, data)) {
    throw new Error("The file content does not match its extension.");
  }

  let text = "";
  const hyperlinks: ResumeHyperlink[] = [];

  if (extension === "txt") {
    text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    // Find any explicit URLs in the text
    const foundUrls = text.match(/https?:\/\/[^\s)]+/gi) ?? [];
    for (const url of foundUrls) {
      hyperlinks.push({ url });
    }
  }

  if (extension === "docx") {
    text = (await mammoth.extractRawText({ arrayBuffer: bytes })).value;
    try {
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer: bytes });
      const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
      let match: RegExpExecArray | null;
      while ((match = linkRegex.exec(htmlResult.value)) !== null) {
        const url = match[1]?.trim();
        const label = match[2]?.replace(/<[^>]+>/g, "").trim();
        if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
          hyperlinks.push({ url, label: label || undefined });
        }
      }
    } catch {
      // Non-fatal if HTML conversion fails
    }
  }

  if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const document = await pdfjs.getDocument({ data, useWorkerFetch: false }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));

      try {
        const annotations = await page.getAnnotations();
        for (const annot of annotations) {
          if (annot.subtype === "Link") {
            const url = annot.url || annot.unsafeUrl;
            if (typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"))) {
              hyperlinks.push({ url });
            }
          }
        }
      } catch {
        // Non-fatal if annotation extraction fails on this page
      }
    }
    text = pages.join("\n");
  }

  // Deduplicate hyperlinks by normalized URL
  const seenUrls = new Set<string>();
  const uniqueHyperlinks = hyperlinks.filter((item) => {
    const norm = item.url.toLowerCase().replace(/\/$/, "");
    if (seenUrls.has(norm)) return false;
    seenUrls.add(norm);
    return true;
  });

  return {
    fileName: file.name,
    fileType: extension,
    text: text.trim(),
    parse: assessParseability(text),
    hyperlinks: uniqueHyperlinks
  };
}
