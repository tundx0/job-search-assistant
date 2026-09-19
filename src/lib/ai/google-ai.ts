import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google AI client
let googleAI: GoogleGenerativeAI | null = null;

/**
 * Initialize the Google AI client with the API key
 */
export function initGoogleAI() {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.warn(
      "Google AI API key not found. Google AI features will be disabled."
    );
    return null;
  }

  try {
    googleAI = new GoogleGenerativeAI(apiKey);
    return googleAI;
  } catch (error) {
    console.error("Error initializing Google AI:", error);
    return null;
  }
}

/**
 * Generate text using Google AI
 */
export async function generateWithGoogleAI(
  prompt: string,
  systemPrompt: string,
  temperature: number = 0.7,
  maxTokens: number = 2000
): Promise<string> {
  if (!googleAI) {
    initGoogleAI();

    if (!googleAI) {
      throw new Error("Google AI is not available. Please check your API key.");
    }
  }

  try {
    // Get the Gemini Pro model
    const model = googleAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Create a chat session
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "I understand and will follow these instructions." }],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });

    // Generate the response
    const result = await chat.sendMessage(prompt);
    const response = result.response;

    return response.text();
  } catch (error) {
    console.error("Error generating with Google AI:", error);
    throw new Error(
      "Failed to generate content with Google AI. Please try again later."
    );
  }
}
