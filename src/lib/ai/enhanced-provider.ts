import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getUserApiKey,
  getUserAiModelPreference,
  ApiProvider,
} from "@/lib/api-keys/user-api-keys";
import { generateWithGoogleAI } from "./google-ai";

// Define model configurations for each provider
// Export functions for testing
export const generateText = generateTextWithUserKey;

// Get all available models across all providers
export function getAvailableModels(apiKeys?: { [key: string]: string }) {
  // If apiKeys is provided, filter models based on available keys
  if (apiKeys) {
    const availableProviders = Object.keys(apiKeys);
    // Include system providers that don't need API keys
    if (process.env.OPENAI_API_KEY) availableProviders.push("openai");
    if (process.env.GOOGLE_API_KEY) availableProviders.push("google");

    // Only return models for available providers
    const models: Array<{
      id: string;
      name: string;
      description: string;
      provider: string;
    }> = [];
    availableProviders.forEach((provider) => {
      if (AI_MODELS[provider as ApiProvider]) {
        models.push(...AI_MODELS[provider as ApiProvider]);
      }
    });
    return models;
  }

  // If no apiKeys provided, return all models
  return Object.values(AI_MODELS).flat();
}

// Get models for a specific provider
export function getProviderModels(provider: ApiProvider) {
  return AI_MODELS[provider] || [];
}

// Get display name for a model
export function getModelDisplayName(modelId: string): string {
  for (const provider in AI_MODELS) {
    const model = AI_MODELS[provider as ApiProvider].find(
      (m) => m.id === modelId
    );
    if (model) return model.name;
  }
  return modelId; // Return the ID if no display name is found
}

export const AI_MODELS = {
  openai: [
    {
      id: "gpt-4",
      name: "GPT-4",
      description: "Most capable GPT-4 model for complex tasks",
      provider: "openai",
    },
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      description: "Optimized version of GPT-4 with faster response times",
      provider: "openai",
    },
    {
      id: "gpt-4.1-mini",
      name: "GPT-4.1 Mini",
      description: "Smaller, faster version of GPT-4.1 with good performance",
      provider: "openai",
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      description: "Compact version of GPT-4o with efficient performance",
      provider: "openai",
    },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      description: "Efficient model with good balance of capability and speed",
      provider: "openai",
    },
  ],
  google: [
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      description: "Fast and efficient model for most tasks",
      provider: "google",
    },
    {
      id: "gemini-2.0-pro",
      name: "Gemini 2.0 Pro",
      description: "Advanced model for complex reasoning and generation",
      provider: "google",
    },
  ],
  anthropic: [
    {
      id: "claude-3-opus",
      name: "Claude 3 Opus",
      description: "Most powerful Claude model for complex tasks",
      provider: "anthropic",
    },
    {
      id: "claude-3-sonnet",
      name: "Claude 3 Sonnet",
      description: "Balanced model for most use cases",
      provider: "anthropic",
    },
    {
      id: "claude-3-haiku",
      name: "Claude 3 Haiku",
      description: "Fast and efficient model for simpler tasks",
      provider: "anthropic",
    },
  ],
  deepseek: [
    {
      id: "deepseek-coder",
      name: "DeepSeek Coder",
      description: "Specialized for code generation and technical tasks",
      provider: "deepseek",
    },
    {
      id: "deepseek-llm",
      name: "DeepSeek LLM",
      description: "General purpose model for various tasks",
      provider: "deepseek",
    },
  ],
};

/**
 * Generate text using a specific user's configured AI provider and API key
 */
export async function generateTextWithUserKey(
  userId: string,
  prompt: string,
  systemPrompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    provider?: ApiProvider;
    modelId?: string;
  } = {}
): Promise<string> {
  const { temperature = 0.7, maxTokens = 2000 } = options;

  // Get user's preferred provider or use the one specified in options
  let provider = options.provider;
  let preferredModelId = null;

  if (!provider) {
    const userPreference = await getUserAiModelPreference(userId);
    provider = userPreference.provider || "openai"; // Default to OpenAI if no preference
    preferredModelId = userPreference.modelId; // Get the user's preferred model ID
  }
  
  // Ensure provider is a string (ApiProvider type), not an object
  if (typeof provider === 'object' && provider !== null) {
    provider = (provider as {provider: ApiProvider}).provider || "openai";
  }
  
  // Ensure provider is defined and is a valid ApiProvider
  const safeProvider = provider as ApiProvider;

  // Get the user's API key for the selected provider
  const apiKey = await getUserApiKey(userId, safeProvider);

  // If user has no API key for this provider, fall back to system API key
  if (!apiKey) {
    // Use the system's default provider
    return generateTextWithSystemKey(prompt, systemPrompt, {
      temperature,
      maxTokens,
    });
  }

  // Get the model ID to use - priority: options > user preference > default
  const modelId =
    options.modelId || preferredModelId || getDefaultModelForProvider(safeProvider);

  // Log the model being used for generation
  console.log(`Generating content with ${safeProvider} model: ${modelId}`);

  try {
    switch (safeProvider) {
      case "openai":
        return await generateWithOpenAI(
          apiKey,
          modelId,
          prompt,
          systemPrompt,
          temperature,
          maxTokens
        );
      case "google":
        return await generateWithGoogleAIKey(
          apiKey,
          modelId,
          prompt,
          systemPrompt,
          temperature,
          maxTokens
        );
      case "anthropic":
        return await generateWithAnthropic(
          apiKey,
          modelId,
          prompt,
          systemPrompt,
          temperature,
          maxTokens
        );
      case "deepseek":
        return await generateWithDeepseek(
          apiKey,
          modelId,
          prompt,
          systemPrompt,
          temperature,
          maxTokens
        );
      default:
        throw new Error(`Unsupported AI provider: ${safeProvider}`);
    }
  } catch (error) {
    console.error(`Error generating text with ${safeProvider}:`, error);
    throw new Error(
      `Failed to generate content with ${safeProvider}. Please check your API key or try a different provider.`
    );
  }
}

/**
 * Generate text using the system's API keys (fallback)
 */
export async function generateTextWithSystemKey(
  prompt: string,
  systemPrompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const { temperature = 0.7, maxTokens = 2000 } = options;

  // Check if OpenAI system key is available
  if (process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    return response.choices[0].message.content || "";
  }

  // If no OpenAI key, try Google AI
  if (process.env.GOOGLE_API_KEY) {
    // The generateWithGoogleAI function uses the environment variable internally
    // and has a different signature than our other provider functions
    return generateWithGoogleAI(prompt, systemPrompt, temperature, maxTokens);
  }

  throw new Error(
    "No system AI provider is available. Please configure an API key in your settings."
  );
}

/**
 * Generate text with OpenAI using user's API key
 */
export async function generateWithOpenAI(
  apiKey: string,
  modelId: string,
  prompt: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  const response = await openai.chat.completions.create({
    model: modelId,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature,
    max_tokens: maxTokens,
  });

  return response.choices[0].message.content || "";
}

/**
 * Generate text with Google AI using user's API key
 */
export async function generateWithGoogleAIKey(
  apiKey: string,
  modelId: string,
  prompt: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const googleAI = new GoogleGenerativeAI(apiKey);

  // Get the model
  const model = googleAI.getGenerativeModel({ model: modelId });

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
}

/**
 * Generate text with Anthropic Claude using user's API key
 */
export async function generateWithAnthropic(
  apiKey: string,
  modelId: string,
  prompt: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  // Note: We would need to install the Anthropic SDK
  // This is a placeholder implementation
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelId,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error("Error with Anthropic API:", error);
    throw new Error(
      "Failed to generate content with Anthropic Claude. Please check your API key."
    );
  }
}

/**
 * Generate text with DeepSeek using user's API key
 */
export async function generateWithDeepseek(
  apiKey: string,
  modelId: string,
  prompt: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  // Note: We would need to install the DeepSeek SDK or use their API directly
  // This is a placeholder implementation
  try {
    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          max_tokens: maxTokens,
          temperature: temperature,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error with DeepSeek API:", error);
    throw new Error(
      "Failed to generate content with DeepSeek. Please check your API key."
    );
  }
}

/**
 * Get the default model ID for a provider
 */
export function getDefaultModelForProvider(provider: ApiProvider): string {
  switch (provider) {
    case "openai":
      return "gpt-4";
    case "google":
      return "gemini-2.0-flash";
    case "anthropic":
      return "claude-3-sonnet";
    case "deepseek":
      return "deepseek-llm";
    default:
      return "gpt-4";
  }
}
