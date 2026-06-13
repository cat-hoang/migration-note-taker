import { NextResponse } from "next/server";
import type { AnalysisProvider } from "@/types";
import { analyzeWithClaude } from "@/lib/claude";
import { analyzeWithOpenAI } from "@/lib/openai";
import { analyzeLocally } from "@/lib/localAnalyzer";

export async function POST(req: Request) {
  try {
    const body = await req.json() as { transcript?: string; provider?: AnalysisProvider };
    const { transcript, provider = "local" } = body;

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    if (provider === "claude" && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 503 });
    }

    if (provider === "openai" && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 503 });
    }

    let result;
    switch (provider) {
      case "claude":
        result = await analyzeWithClaude(transcript);
        break;
      case "openai":
        result = await analyzeWithOpenAI(transcript);
        break;
      case "local":
      default:
        result = analyzeLocally(transcript);
        break;
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Analysis error:", err);
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
