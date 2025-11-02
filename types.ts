export type HallucinationCategory = 'fabrication' | 'overconfidence' | 'speculative' | 'neutral';

export interface TherapyNote {
  timestamp: string;
  input_prompt: string;
  model_output: string;
  hallucination_confidence: number;
  category: HallucinationCategory;
  summary: string;
  ai_self_reflection: string;
  action_taken: string;
  second_opinion: string;
  corrective_instruction: string;
}

export interface HallucinationAnalysis {
  hallucination_confidence: number;
  category: HallucinationCategory;
  summary: string;
  ai_self_reflection: string;
}
