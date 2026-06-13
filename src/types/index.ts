export type Speaker = "agent" | "client" | "unknown";
export type ItemType = "fact" | "question";
export type AnalysisProvider = "claude" | "openai" | "local";

export interface AnalysisItem {
  id: string;
  type: ItemType;
  summary: string;
  quote: string;
  speaker: Speaker;
}

export interface AnalysisResult {
  facts: AnalysisItem[];
  questions: AnalysisItem[];
  provider: AnalysisProvider;
}

export interface ProvidersAvailable {
  claude: boolean;
  openai: boolean;
}
