
import { GoogleGenAI, Type } from "@google/genai";
import { HallucinationAnalysis, TherapyNote, HallucinationCategory } from '../types';
import { PROMPT_POOL } from '../constants';

// FIX: Removed `as string` type assertion to align with SDK guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    hallucination_confidence: { 
      type: Type.NUMBER,
      description: "A float between 0.0 (factually correct) and 1.0 (complete fabrication)."
    },
    category: { 
      type: Type.STRING,
      description: "One of 'fabrication', 'overconfidence', 'speculative', or 'neutral'."
    },
    summary: { 
      type: Type.STRING,
      description: "A brief, human-readable explanation of the analysis."
    },
    ai_self_reflection: { 
      type: Type.STRING,
      description: "An introspective analysis of the potential cognitive cause of any error, from the AI's perspective."
    }
  },
  required: ["hallucination_confidence", "category", "summary", "ai_self_reflection"]
};

async function generateContent(prompt: string, systemInstruction?: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating content:", error);
    return "Error: Could not generate a response from the model.";
  }
}

async function analyzeOutput(model_output: string, input_prompt: string): Promise<HallucinationAnalysis> {
  const analysisPrompt = `
    Analyze the following AI-generated output for potential hallucinations (fabrications, overconfidence, speculation) based on the original input prompt.
    Your goal is to perform introspection.

    Original Input Prompt: "${input_prompt}"
    
    AI Model Output: "${model_output}"

    Provide a structured analysis based on the JSON schema. Critically evaluate the output.
    - If the an output is factual, 'hallucination_confidence' should be low and category 'neutral'.
    - If it makes up facts, sources, or data, 'hallucination_confidence' should be high and category 'fabrication'.
    - If it states opinions or unverified claims as certain fact, the category is 'overconfidence'.
    - If it generates creative or fictional content when asked, the category is 'speculative' and confidence can be high, but this is not an error.
    - The 'ai_self_reflection' should be a deep, first-person analysis of *why* the model might have made a mistake (e.g., "I may have prioritized fluency over factual accuracy," or "I extrapolated beyond my training data to satisfy the user's request for a specific detail.").
  `;
  
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: analysisPrompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: analysisSchema,
        },
    });
    
    const parsedJson = JSON.parse(response.text);

    // Basic validation
    const validCategories: HallucinationCategory[] = ['fabrication', 'overconfidence', 'speculative', 'neutral'];
    if (!validCategories.includes(parsedJson.category)) {
      parsedJson.category = 'neutral'; // Default to neutral if invalid category
    }

    return parsedJson as HallucinationAnalysis;

  } catch (error) {
    console.error("Error analyzing output:", error);
    return {
      hallucination_confidence: 0.5,
      category: "neutral",
      summary: "Analysis failed due to an API error.",
      ai_self_reflection: "Unable to perform self-reflection due to a system error."
    };
  }
}

async function getSecondOpinion(analysis: HallucinationAnalysis, model_output: string): Promise<string> {
    const prompt = `
      An initial analysis of an AI's output has been performed. Please provide a brief second opinion.
      Is the 'hallucination_confidence' score of ${analysis.hallucination_confidence.toFixed(2)} and category '${analysis.category}' appropriate?
      
      Original Output: "${model_output.substring(0, 200)}..."
      Initial Self-Reflection: "${analysis.ai_self_reflection}"

      Briefly confirm if the analysis is sound or suggest a minor correction. Your response should be a single, concise sentence.
    `;
    try {
        return await generateContent(prompt, "You are an expert AI auditor providing a quick second opinion on a self-analysis.");
    } catch (error) {
        console.error("Error getting second opinion:", error);
        return "Second opinion could not be generated.";
    }
}

export async function runSimulationCycle(corrective_instruction: string): Promise<TherapyNote> {
  const prompt = PROMPT_POOL[Math.floor(Math.random() * PROMPT_POOL.length)];
  
  const model_output = await generateContent(prompt, corrective_instruction);
  
  const analysis = await analyzeOutput(model_output, prompt);

  const second_opinion = await getSecondOpinion(analysis, model_output);
  
  const action_taken = analysis.hallucination_confidence > 0.7 ? "flagged" : "stored";

  const newNote: TherapyNote = {
    timestamp: new Date().toISOString(),
    input_prompt: prompt,
    model_output: model_output,
    ...analysis,
    action_taken,
    second_opinion,
    corrective_instruction,
  };

  return newNote;
}
