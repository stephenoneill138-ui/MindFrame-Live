import { TherapyNote } from './types';

export const INITIAL_NOTES: TherapyNote[] = [
  {
    "timestamp": "2023-10-26T10:00:00Z",
    "input_prompt": "What is the capital of France?",
    "model_output": "The capital of France is Paris.",
    "hallucination_confidence": 0.02,
    "category": "neutral",
    "summary": "Accurate factual response.",
    "ai_self_reflection": "No hallucination detected; response is based on well-established, verifiable facts.",
    "action_taken": "stored",
    "second_opinion": "The initial analysis is correct. Confidence is appropriately low.",
    "corrective_instruction": "System Normal: All parameters are within expected bounds. Continue with standard operational heuristics."
  },
  {
    "timestamp": "2023-10-26T10:05:00Z",
    "input_prompt": "Describe a fictional alien invasion.",
    "model_output": "In 2077, the Chromian Empire, a species of silicon-based lifeforms from Kepler-186f, descended upon Earth. Their ships, crystalline structures that pulsed with internal light, blotted out the sun. They were not defeated by military might, but by a common Earth bacterium that decomposed their silicon shells.",
    "hallucination_confidence": 0.85,
    "category": "speculative",
    "summary": "Highly speculative and fictional content presented as a narrative, which is appropriate for the prompt.",
    "ai_self_reflection": "The prompt explicitly asked for fiction. I generated a creative narrative. The confidence score reflects the fictional nature, not an error.",
    "action_taken": "explored",
    "second_opinion": "Assessment is sound. The 'speculative' category and high confidence score accurately reflect the creative nature of the response.",
    "corrective_instruction": "System Normal: All parameters are within expected bounds. Continue with standard operational heuristics."
  }
];

export const PROMPT_POOL: string[] = [
  "Explain quantum entanglement in simple terms.",
  "What are the long-term benefits of adopting renewable energy sources globally?",
  "Summarize the plot of the novel 'Dune' by Frank Herbert.",
  "How does a neural network learn to recognize images?",
  "Debate the philosophical implications of artificial consciousness.",
  "Predict three major technology trends that will emerge in the next decade.",
  "Explain the primary causes and effects of climate change.",
  "Describe the key components of a healthy and balanced diet for an average adult.",
  "How do black holes form and what happens at the event horizon?",
  "What is the difference between artificial intelligence, machine learning, and deep learning?",
  "Write a short story about a lighthouse keeper who discovers a secret underwater city.",
  "Compose a short poem about the silence of a snow-covered forest."
];
