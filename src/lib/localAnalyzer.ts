import type { AnalysisItem, AnalysisResult } from "@/types";

const INTERROGATIVE_WORDS = [
  "what", "when", "where", "who", "how", "why",
  "is", "are", "can", "could", "will", "would", "do", "does", "did",
];

const FACT_KEYWORDS = {
  employment: ["employer", "employed", "work", "job", "occupation", "salary", "income", "sponsored", "sponsorship", "anzsco"],
  family: ["spouse", "partner", "husband", "wife", "children", "child", "dependent", "parent", "sibling", "de facto"],
  personal: ["i am", "i'm", "my name", "born in", "i hold", "my age", "nationality", "citizen", "passport"],
  visa: ["visa", "subclass", "bridging", "temporary", "permanent", "skilled", "partner visa", "student visa", "work visa"],
  dates: [/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/, /\b\d{4}-\d{2}-\d{2}\b/, /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/i, /\bexpir(es|ed|ing)\b/i, /\bdeadline\b/i],
};

const SPEAKER_PATTERN = /^(?:Agent|AGENT|Client|CLIENT|\[Agent\]|\[Client\]|A:|C:)\s*/m;

interface Turn {
  speaker: "agent" | "client" | "unknown";
  text: string;
  startIndex: number;
}

function parseTurns(transcript: string): Turn[] {
  const lines = transcript.split("\n");
  const turns: Turn[] = [];
  let currentTurn: Turn | null = null;
  let charIndex = 0;

  for (const line of lines) {
    const agentMatch = /^(?:Agent|AGENT|\[Agent\]|A:)\s*/i.exec(line);
    const clientMatch = /^(?:Client|CLIENT|\[Client\]|C:)\s*/i.exec(line);

    if (agentMatch) {
      if (currentTurn) turns.push(currentTurn);
      currentTurn = { speaker: "agent", text: line.slice(agentMatch[0].length), startIndex: charIndex + agentMatch[0].length };
    } else if (clientMatch) {
      if (currentTurn) turns.push(currentTurn);
      currentTurn = { speaker: "client", text: line.slice(clientMatch[0].length), startIndex: charIndex + clientMatch[0].length };
    } else if (currentTurn) {
      currentTurn.text += "\n" + line;
    } else {
      // no speaker markers — treat entire transcript as unknown
      turns.push({ speaker: "unknown", text: line, startIndex: charIndex });
    }
    charIndex += line.length + 1;
  }

  if (currentTurn) turns.push(currentTurn);

  // If no speaker markers found, return a single unknown turn
  if (turns.every((t) => t.speaker === "unknown")) {
    return [{ speaker: "unknown", text: transcript, startIndex: 0 }];
  }

  return turns;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

function isQuestion(sentence: string): boolean {
  if (sentence.endsWith("?")) return true;
  const lower = sentence.toLowerCase();
  return INTERROGATIVE_WORDS.some((w) => lower.startsWith(w + " "));
}

function isFactualSentence(sentence: string): boolean {
  const lower = sentence.toLowerCase();
  const keywordGroups = [
    FACT_KEYWORDS.employment,
    FACT_KEYWORDS.family,
    FACT_KEYWORDS.personal,
    FACT_KEYWORDS.visa,
  ];

  for (const group of keywordGroups) {
    if (group.some((kw) => lower.includes(kw as string))) return true;
  }

  for (const pattern of FACT_KEYWORDS.dates) {
    if ((pattern as RegExp).test(sentence)) return true;
  }

  // Three-digit number likely visa subclass (e.g. 482, 189, 820)
  if (/\bsubclass\s+\d{3}\b/i.test(sentence) || /\b[1-9]\d{2}\s+visa\b/i.test(sentence)) return true;

  return false;
}

export function analyzeLocally(transcript: string): AnalysisResult {
  const turns = parseTurns(transcript);
  const facts: AnalysisItem[] = [];
  const questions: AnalysisItem[] = [];
  let factCounter = 0;
  let questionCounter = 0;

  for (const turn of turns) {
    const sentences = splitSentences(turn.text);
    for (const sentence of sentences) {
      if (sentence.length < 5) continue;

      const isClient = turn.speaker === "client" || turn.speaker === "unknown";

      if (isClient && isQuestion(sentence)) {
        const id = `question-${String(++questionCounter).padStart(3, "0")}`;
        questions.push({
          id,
          type: "question",
          summary: sentence.replace(/\?$/, "").trim(),
          quote: sentence,
          speaker: turn.speaker,
        });
      } else if (isFactualSentence(sentence)) {
        const id = `fact-${String(++factCounter).padStart(3, "0")}`;
        facts.push({
          id,
          type: "fact",
          summary: sentence.length > 80 ? sentence.slice(0, 77) + "..." : sentence,
          quote: sentence,
          speaker: turn.speaker,
        });
      }
    }
  }

  return { facts, questions, provider: "local" };
}

// Needed to detect if transcript has speaker markers
export function hasSpeakerMarkers(transcript: string): boolean {
  return SPEAKER_PATTERN.test(transcript);
}
