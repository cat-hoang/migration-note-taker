"use client";

interface Props {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
}

export default function AnalyzeButton({ onClick, disabled, isLoading }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
    >
      {isLoading ? (
        <>
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          Analysing…
        </>
      ) : (
        "Analyse Transcript"
      )}
    </button>
  );
}
