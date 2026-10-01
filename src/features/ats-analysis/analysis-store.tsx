"use client";
import { createContext, useContext, useState } from "react";
import type { AnalysisResult } from "@/ats/contracts/analysis";
type ContextValue = { result: AnalysisResult | null; setResult: (result: AnalysisResult | null) => void };
const AnalysisContext = createContext<ContextValue | null>(null);
export function AnalysisProvider({ children }: { children: React.ReactNode }) { const [result, setResult] = useState<AnalysisResult | null>(null); return <AnalysisContext.Provider value={{ result, setResult }}>{children}</AnalysisContext.Provider>; }
export function useAnalysis() { const context = useContext(AnalysisContext); if (!context) throw new Error("useAnalysis must be used inside AnalysisProvider"); return context; }
