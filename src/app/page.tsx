"use client";

import { useState, useEffect } from "react";
import type { AnalysisProvider, AnalysisResult, ProvidersAvailable } from "@/types";
import TranscriptInput from "@/components/TranscriptInput";
import TranscriptPanel from "@/components/TranscriptPanel";
import ResultsPanel from "@/components/ResultsPanel";
import ProviderSelector from "@/components/ProviderSelector";
import AnalyzeButton from "@/components/AnalyzeButton";

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [provider, setProvider] = useState<AnalysisProvider>("local");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<ProvidersAvailable>({ claude: false, openai: false });
  const [showInput, setShowInput] = useState(true);

  useEffect(() => {
    fetch("/api/providers")
      .then((r) => r.json())
      .then((data: ProvidersAvailable) => {
        setAvailable(data);
        if (data.claude) setProvider("claude");
        else if (data.openai) setProvider("openai");
        else setProvider("local");
      })
      .catch(() => {});
  }, []);

  const activeQuote =
    activeId
      ? [...(analysisResult?.facts ?? []), ...(analysisResult?.questions ?? [])].find(
          (item) => item.id === activeId
        )?.quote ?? null
      : null;

  async function handleAnalyze() {
    if (!transcript.trim()) return;
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setActiveId(null);
    setShowInput(false);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, provider }),
      });
      const data = await res.json() as AnalysisResult & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error || "Analysis failed");
      setAnalysisResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setShowInput(true);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelect(id: string) {
    setActiveId((prev) => (prev === id ? null : id));
  }

  function handleTranscriptChange(t: string) {
    setTranscript(t);
    setAnalysisResult(null);
    setShowInput(true);
    setActiveId(null);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 leading-tight">Migration Note Taker</h1>
          <p className="text-xs text-gray-500">AI-assisted transcript analysis for Australian migration agents</p>
        </div>
        <ProviderSelector value={provider} onChange={setProvider} available={available} />
        <AnalyzeButton
          onClick={handleAnalyze}
          disabled={!transcript.trim() || isLoading}
          isLoading={isLoading}
        />
      </header>

      {error && (
        <div className="shrink-0 mx-6 mt-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Main panels */}
      <div className="flex flex-1 min-h-0 divide-x divide-gray-200">
        {/* Left: Transcript */}
        <div className="flex flex-col flex-1 min-w-0 bg-white">
          <div className="shrink-0 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transcript</span>
            {analysisResult && (
              <button
                onClick={() => setShowInput((v) => !v)}
                className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
              >
                {showInput ? "View highlighted" : "Edit transcript"}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            {showInput ? (
              <div className="h-full p-4">
                <TranscriptInput
                  value={transcript}
                  onChange={handleTranscriptChange}
                  disabled={isLoading}
                />
              </div>
            ) : (
              <TranscriptPanel transcript={transcript} activeQuote={activeQuote} />
            )}
          </div>
        </div>

        {/* Right: Results */}
        <div className="flex flex-col w-[420px] shrink-0 bg-white">
          <div className="shrink-0 px-4 py-2 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Analysis Results</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <ResultsPanel
              result={analysisResult}
              activeId={activeId}
              onSelect={handleSelect}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
