"use client";

import { useRef, useState } from "react";

interface Props {
  value: string;
  onChange: (text: string) => void;
  disabled?: boolean;
}

export default function TranscriptInput({ value, onChange, disabled }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setFileError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json() as { text?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error || "Upload failed");
      onChange(data.text!);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      <div
        className="border-2 border-dashed border-gray-200 rounded-lg px-4 py-2 text-center text-sm text-gray-400 cursor-pointer hover:border-blue-300 hover:text-blue-400 transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? "Uploading…" : "Drop a file here or click to upload (.txt, .pdf, .docx)"}
      </div>
      {fileError && <p className="text-xs text-red-500">{fileError}</p>}
      <input
        ref={fileRef}
        type="file"
        accept=".txt,.pdf,.docx"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={`Paste the conversation transcript here…\n\nExpected format:\nAgent: Good morning. Can you tell me your current visa situation?\nClient: I'm on a 482 visa that expires in March 2025…`}
        className="flex-1 w-full resize-none rounded-lg border border-gray-200 p-3 text-sm font-mono leading-relaxed text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:bg-gray-50"
      />
    </div>
  );
}
