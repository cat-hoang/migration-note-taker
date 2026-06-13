"use client";

import { useRef, useEffect } from "react";

interface Props {
  transcript: string;
  activeQuote: string | null;
}

export default function TranscriptPanel({ transcript, activeQuote }: Props) {
  const markRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (markRef.current) {
      markRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeQuote]);

  if (!transcript) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Transcript will appear here
      </div>
    );
  }

  if (!activeQuote) {
    return (
      <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-gray-800 p-4 h-full overflow-auto">
        {transcript}
      </pre>
    );
  }

  const quoteStart = transcript.indexOf(activeQuote);

  if (quoteStart === -1) {
    return (
      <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-gray-800 p-4 h-full overflow-auto">
        {transcript}
      </pre>
    );
  }

  const before = transcript.slice(0, quoteStart);
  const highlighted = transcript.slice(quoteStart, quoteStart + activeQuote.length);
  const after = transcript.slice(quoteStart + activeQuote.length);

  return (
    <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-gray-800 p-4 h-full overflow-auto">
      {before}
      <mark
        ref={markRef}
        className="bg-yellow-200 text-gray-900 rounded px-0.5 ring-2 ring-yellow-400 ring-offset-1 transition-all duration-300"
      >
        {highlighted}
      </mark>
      {after}
    </pre>
  );
}
