"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/types";
import ResultItem from "./ResultItem";

interface Props {
  result: AnalysisResult | null;
  activeId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

type Tab = "facts" | "questions";

const PROVIDER_LABEL: Record<string, string> = {
  claude: "Claude (Anthropic)",
  openai: "OpenAI / Copilot",
  local: "Quick Scan",
};

export default function ResultsPanel({ result, activeId, onSelect, isLoading }: Props) {
  const [tab, setTab] = useState<Tab>("facts");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm">Analysing transcript…</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 text-sm p-6 text-center">
        <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>Analysis results will appear here.</p>
        <p className="text-xs">Paste a transcript and click Analyse.</p>
      </div>
    );
  }

  const items = tab === "facts" ? result.facts : result.questions;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100 shrink-0">
        <div className="flex gap-1">
          <button
            onClick={() => setTab("facts")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === "facts" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Facts
            <span className={`ml-1.5 text-xs rounded-full px-1.5 py-0.5 ${tab === "facts" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}`}>
              {result.facts.length}
            </span>
          </button>
          <button
            onClick={() => setTab("questions")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === "questions" ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Client Questions
            <span className={`ml-1.5 text-xs rounded-full px-1.5 py-0.5 ${tab === "questions" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"}`}>
              {result.questions.length}
            </span>
          </button>
        </div>
        <span className="text-xs text-gray-400">{PROVIDER_LABEL[result.provider]}</span>
      </div>

      <div className="flex-1 overflow-auto p-3 flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center mt-8">
            No {tab === "facts" ? "facts" : "client questions"} found.
          </p>
        ) : (
          items.map((item) => (
            <ResultItem
              key={item.id}
              item={item}
              isActive={activeId === item.id}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
