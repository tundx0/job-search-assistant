import OpenAI from "openai";
import { generateWithGoogleAI, initGoogleAI } from "./google-ai";

// AI Provider types
export type AIProvider = "openai" | "google";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Google AI
initGoogleAI();

/**
 * Get the currently configured AI provider based on environment variables
 */
export function getAIProvider(): AIProvider {
  // Check if Google AI is explicitly enabled
  const useGoogleAI = process.env.USE_GOOGLE_AI === "true";
  
  // Check if OpenAI is available
  const openaiAvailable = !!process.env.OPENAI_API_KEY;
  
  // Check if Google AI is available
  const googleAIAvailable = !!process.env.GOOGLE_AI_API_KEY;
  
  // Determine which provider to use
  if (useGoogleAI && googleAIAvailable) {
    return "google";
  } else if (openaiAvailable) {
    return "openai";
  } else if (googleAIAvailable) {
    return "google";
  } else {
    // Default to OpenAI even if not available (will fail gracefully)
    return "openai";
  }
}

/**
 * Generate text using the configured AI provider
 */
export async function generateText(
  prompt: string,
  systemPrompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    provider?: AIProvider;
  } = {}
): Promise<string> {
  const {
    temperature = 0.7,
    maxTokens = 2000,
    provider = getAIProvider(),
  } = options;
  
  try {
    if (provider === "google") {
      return await generateWithGoogleAI(
        prompt,
        systemPrompt,
        temperature,
        maxTokens
      );
    } else {
      // Use OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
      });
      
      return response.choices[0].message.content || "";
    }
  } catch (error) {
    console.error(`Error generating text with ${provider}:`, error);
    throw new Error(`Failed to generate content with ${provider}. Please try again later.`);
  }
}
