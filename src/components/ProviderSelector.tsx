"use client";

import type { AnalysisProvider, ProvidersAvailable } from "@/types";

interface Props {
  value: AnalysisProvider;
  onChange: (p: AnalysisProvider) => void;
  available: ProvidersAvailable;
}

const OPTIONS: { id: AnalysisProvider; label: string; sublabel: string }[] = [
  { id: "claude", label: "Claude", sublabel: "Anthropic AI" },
  { id: "openai", label: "OpenAI / Copilot", sublabel: "GPT-4o" },
  { id: "local", label: "Quick Scan", sublabel: "No AI · Offline" },
];

export default function ProviderSelector({ value, onChange, available }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {OPTIONS.map(({ id, label, sublabel }) => {
        const isAvailable = id === "local" || available[id as keyof ProvidersAvailable];
        const isActive = value === id;
        return (
          <button
            key={id}
            onClick={() => isAvailable && onChange(id)}
            disabled={!isAvailable}
            title={!isAvailable ? `${label} API key not configured` : undefined}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
              isActive
                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                : isAvailable
                ? "bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-600"
                : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <span className="block">{label}</span>
            <span className={`block text-xs font-normal ${isActive ? "text-blue-100" : "text-gray-400"}`}>
              {sublabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
