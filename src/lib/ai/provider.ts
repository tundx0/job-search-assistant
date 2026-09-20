import OpenAI from "openai";
import { generateWithGoogleAI, initGoogleAI } from "./google-ai";
import { MissingApiKeyError } from "./errors";

export type AIProvider = "openai" | "google";

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new MissingApiKeyError();
  }

  if (!openai) {
    openai = new OpenAI({ apiKey });
  }

  return openai;
}

/**
 * Get the currently configured AI provider based on environment variables
 */
export function getAIProvider(): AIProvider {
  const useGoogleAI = process.env.USE_GOOGLE_AI === "true";
  const openaiAvailable = !!process.env.OPENAI_API_KEY;
  const googleAIAvailable = !!(
    process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY
  );

  if (useGoogleAI && googleAIAvailable) {
    return "google";
  } else if (openaiAvailable) {
    return "openai";
  } else if (googleAIAvailable) {
    return "google";
  } else {
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
      initGoogleAI();
      return await generateWithGoogleAI(
        prompt,
        systemPrompt,
        temperature,
        maxTokens
      );
    }

    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      throw error;
    }
    console.error(`Error generating text with ${provider}:`, error);
    throw new Error(
      `Failed to generate content with ${provider}. Please try again later.`
    );
  }
}
