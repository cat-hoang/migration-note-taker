import OpenAI from "openai";
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

Return a JSON object with this exact shape:
{
  "facts": [{ "id": "fact-001", "type": "fact", "summary": "...", "quote": "...", "speaker": "agent|client|unknown" }],
  "questions": [{ "id": "question-001", "type": "question", "summary": "...", "quote": "...", "speaker": "agent|client|unknown" }]
}

Return empty arrays if a category has no items. Return ONLY the JSON object, no prose.`;

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });
  }
  return _client;
}

export async function analyzeWithOpenAI(transcript: string): Promise<AnalysisResult> {
  const client = getClient();
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  const response = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Please analyse the following transcript:\n\n${transcript}` },
    ],
    max_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty response");

  const parsed = JSON.parse(content) as { facts: AnalysisResult["facts"]; questions: AnalysisResult["questions"] };
  return { facts: parsed.facts ?? [], questions: parsed.questions ?? [], provider: "openai" };
}
