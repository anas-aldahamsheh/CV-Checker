const aliases: Record<string, string> = { js: "javascript", javascript: "javascript", ts: "typescript", typescript: "typescript", reactjs: "react", "react.js": "react", node: "node.js", nodejs: "node.js", "node.js": "node.js", postgres: "postgresql", postgresql: "postgresql", nextjs: "next.js", "next.js": "next.js", k8s: "kubernetes", kubernetes: "kubernetes" };
export function normalizeTerm(value: string) { return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}+#.\-/ ]/gu, " ").replace(/\s+/g, " ").trim(); }
export function canonicalTerm(value: string) { const normalized = normalizeTerm(value); return aliases[normalized] ?? normalized; }
export function includesTerm(text: string, term: string) { const source = ` ${normalizeTerm(text)} `; const target = ` ${canonicalTerm(term)} `; return source.includes(target) || source.includes(` ${normalizeTerm(term)} `); }
export function uniqueTerms(values: string[]) { return [...new Set(values.map(canonicalTerm).filter(Boolean))]; }
