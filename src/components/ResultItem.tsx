"use client";

import type { AnalysisItem } from "@/types";

interface Props {
  item: AnalysisItem;
  isActive: boolean;
  onSelect: (id: string) => void;
}

const SPEAKER_BADGE: Record<string, string> = {
  agent: "bg-blue-100 text-blue-700",
  client: "bg-green-100 text-green-700",
  unknown: "bg-gray-100 text-gray-500",
};

export default function ResultItem({ item, isActive, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(isActive ? "" : item.id)}
      className={`w-full text-left rounded-lg border p-3 transition-all ${
        isActive
          ? "border-yellow-400 bg-yellow-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${SPEAKER_BADGE[item.speaker]}`}>
          {item.speaker}
        </span>
        <p className="text-sm text-gray-800 leading-snug">{item.summary}</p>
      </div>
      {isActive && (
        <blockquote className="mt-2 border-l-2 border-yellow-400 pl-2 text-xs text-gray-500 italic line-clamp-3">
          &ldquo;{item.quote}&rdquo;
        </blockquote>
      )}
    </button>
  );
}
