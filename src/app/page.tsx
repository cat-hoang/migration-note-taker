"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { AnalysisProvider, AnalysisResult, ProvidersAvailable } from "@/types";
import TranscriptInput from "@/components/TranscriptInput";
import TranscriptPanel from "@/components/TranscriptPanel";
import ResultsPanel from "@/components/ResultsPanel";
import ProviderSelector from "@/components/ProviderSelector";
import AnalyzeButton from "@/components/AnalyzeButton";

const MIN_PANEL_WIDTH = 240;
const MAX_PANEL_WIDTH = 800;
const DEFAULT_PANEL_WIDTH = 420;

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [provider, setProvider] = useState<AnalysisProvider>("local");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<ProvidersAvailable>({ claude: false, openai: false });
  const [showInput, setShowInput] = useState(true);

  // Resizable panel state
  const [rightPanelWidth, setRightPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = rightPanelWidth;
    setIsDragging(true);
  }, [rightPanelWidth]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = dragStartX.current - e.clientX;
      const newWidth = dragStartWidth.current + delta;
      const clampedWidth = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, newWidth));

      // Also clamp to not exceed container width minus minimum left panel size
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const maxAllowed = containerWidth - MIN_PANEL_WIDTH;
        setRightPanelWidth(Math.min(clampedWidth, maxAllowed));
      } else {
        setRightPanelWidth(clampedWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

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
    <div
      className="flex flex-col h-screen bg-gray-50"
      style={isDragging ? { userSelect: "none", cursor: "col-resize" } : undefined}
    >
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
      <div ref={containerRef} className="flex flex-1 min-h-0">
        {/* Left: Transcript */}
        <div className="flex flex-col flex-1 min-w-0 bg-white border-r border-gray-200">
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

        {/* Resizable Divider */}
        <div
          onMouseDown={handleDividerMouseDown}
          className={`relative shrink-0 w-1 cursor-col-resize group transition-colors ${
            isDragging ? "bg-blue-400" : "bg-gray-200 hover:bg-blue-300"
          }`}
          title="Drag to resize panels"
        >
          {/* Drag handle indicator */}
          <div className={`absolute inset-y-0 -left-1 -right-1 flex items-center justify-center`}>
            <div className={`flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isDragging ? "opacity-100" : ""}`}>
              <div className="w-0.5 h-4 bg-gray-400 rounded-full" />
              <div className="w-0.5 h-4 bg-gray-400 rounded-full" />
              <div className="w-0.5 h-4 bg-gray-400 rounded-full" />
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div
          className="flex flex-col shrink-0 bg-white"
          style={{ width: `${rightPanelWidth}px` }}
        >
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
