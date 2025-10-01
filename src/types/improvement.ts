// Types for the AI Prompt Improvement feature

export interface ImprovementResult {
  improved_prompt: string;
  changes_made: string[];
  reasoning: string;
  clarity_score: number;
  specificity_score: number;
  structure_score: number;
  overall_score: number;
  cached: boolean;
  improvement_id?: string;
  metadata?: {
    model: string;
    tokens: number;
    cost: string;
    latency_ms: number;
  };
}

export interface ImprovementRequest {
  prompt: string;
  skipCache?: boolean;
}

export interface ImprovementHistory {
  timestamp: string;
  improvement_id?: string;
  changes_summary: string;
}

export interface PromptWithImprovement {
  id: string;
  title: string;
  prompt_text: string;
  was_improved: boolean;
  original_version?: string;
  improvement_history: ImprovementHistory[];
}
