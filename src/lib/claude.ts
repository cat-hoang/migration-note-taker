import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult } from "@/types";

const SYSTEM_PROMPT = `You are an expert assistant for Australian Registered Migration Agents. Analyse a conversation transcript between a migration agent and their client.

Extract two categories:

1. FACTS — factual information stated about the client:
   - Personal details (name, DOB, nationality, country of birth, age)
   - Current visa status, subclass, expiry dates
   - Previous visa applications and outcomes
   - Employment (employer, occupation, ANZSCO codes, sponsorship)
   - Family circumstances (partner, children, dependants)
   - Length of time in Australia
   - Educational qualifications
   - Health/character considerations
   - Any dates, deadlines, or timeframes mentioned

2. QUESTIONS — every question the CLIENT asked. Include implied requests for clarification. Do NOT include agent questions.

Speaker format in transcripts may be: "Agent:"/"Client:", "[Agent]"/"[Client]", "A:"/"C:", or similar.

CRITICAL QUOTE RULE: The "quote" field must be a verbatim substring of the transcript. Copy character-for-character including punctuation and capitalisation. The frontend uses indexOf() to locate and highlight it.

Return empty arrays if a category has no items.`;

const TOOL_SCHEMA: Anthropic.Tool = {
  name: "extract_analysis",
  description: "Extract facts and client questions from a migration consultation transcript",
  input_schema: {
    type: "object",
    properties: {
      facts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { type: "string", enum: ["fact"] },
            summary: { type: "string" },
            quote: { type: "string" },
            speaker: { type: "string", enum: ["agent", "client", "unknown"] },
          },
          required: ["id", "type", "summary", "quote", "speaker"],
        },
      },
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { type: "string", enum: ["question"] },
            summary: { type: "string" },
            quote: { type: "string" },
            speaker: { type: "string", enum: ["agent", "client", "unknown"] },
          },
          required: ["id", "type", "summary", "quote", "speaker"],
        },
      },
    },
    required: ["facts", "questions"],
  },
};

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export async function analyzeWithClaude(transcript: string): Promise<AnalysisResult> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    tools: [TOOL_SCHEMA],
    tool_choice: { type: "tool", name: "extract_analysis" },
    messages: [
      {
        role: "user",
        content: `Please analyse the following transcript:\n\n${transcript}`,
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a tool_use block");
  }

  const input = toolUse.input as { facts: AnalysisResult["facts"]; questions: AnalysisResult["questions"] };
  return { facts: input.facts ?? [], questions: input.questions ?? [], provider: "claude" };
}
