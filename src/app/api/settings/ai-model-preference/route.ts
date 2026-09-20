import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { 
  updateUserAiModelPreference, 
  getUserAiModelPreference,
  getUserApiKey,
  ApiProvider
} from "@/lib/api-keys/user-api-keys";
import { AI_MODELS } from "@/lib/ai/enhanced-provider";

// GET /api/settings/ai-model-preference - Get the current user's AI model preference
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { provider, modelId } = await getUserAiModelPreference(user.id);
    
    // If the user has a preference, check if they have a valid API key for that provider
    let hasValidKey = false;
    if (provider) {
      const apiKey = await getUserApiKey(user.id, provider);
      hasValidKey = !!apiKey;
    }
    
    // If no model ID is saved, get the default model for the provider
    let finalModelId = modelId;
    if (!finalModelId && provider && provider !== "mcp" && AI_MODELS[provider as keyof typeof AI_MODELS]) {
      finalModelId = AI_MODELS[provider as keyof typeof AI_MODELS][0].id;
    }
    
    return NextResponse.json({
      provider,
      modelId: finalModelId,
      hasValidKey,
    });
  } catch (error) {
    console.error("Error fetching AI model preference:", error);
    return NextResponse.json(
      { message: "Failed to fetch AI model preference" },
      { status: 500 }
    );
  }
}

// POST /api/settings/ai-model-preference - Update the current user's AI model preference
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { provider, modelId } = await req.json();
    
    if (!provider) {
      return NextResponse.json(
        { message: "Provider is required" },
        { status: 400 }
      );
    }
    
    // Validate provider
    const validProviders = ["openai", "google", "anthropic", "deepseek"];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { message: "Invalid provider" },
        { status: 400 }
      );
    }
    
    // Validate model ID if provided
    if (modelId && provider !== "mcp") {
      const validModels = AI_MODELS[provider as keyof typeof AI_MODELS].map(model => model.id);
      if (!validModels.includes(modelId)) {
        return NextResponse.json(
          { message: "Invalid model ID for the selected provider" },
          { status: 400 }
        );
      }
    }
    
    // Check if the user has a valid API key for this provider
    // If it's a custom provider (not system default), they need a key
    if (provider !== "openai" && provider !== "google") {
      const apiKey = await getUserApiKey(user.id, provider as ApiProvider);
      if (!apiKey) {
        return NextResponse.json(
          { message: `You need to add an API key for ${provider} before selecting it as your preferred provider` },
          { status: 400 }
        );
      }
    }
    
    const success = await updateUserAiModelPreference(
      user.id, 
      provider as ApiProvider, 
      modelId
    );
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { message: "Failed to update AI model preference" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating AI model preference:", error);
    return NextResponse.json(
      { message: "Failed to update AI model preference" },
      { status: 500 }
    );
  }
}
