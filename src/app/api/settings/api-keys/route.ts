import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { 
  saveUserApiKey, 
  getUserApiKeys, 
  deleteUserApiKey,
  ApiProvider
} from "@/lib/api-keys/user-api-keys";

// GET /api/settings/api-keys - Get all API keys for the current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get all user API keys with masked values
    const apiKeys = await getUserApiKeys(user.id, true);
    
    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { message: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

// POST /api/settings/api-keys - Save an API key for the current user
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const provider = body.provider;
    let apiKey = body.apiKey;

    if (provider === "mcp" && apiKey === "GENERATE") {
      const crypto = await import("crypto");
      apiKey = `mcp_${user.id}_${crypto.randomBytes(24).toString("hex")}`;
    }
    
    if (!provider || !apiKey) {
      return NextResponse.json(
        { message: "Provider and API key are required" },
        { status: 400 }
      );
    }
    
    // Validate provider
    const validProviders = ["openai", "google", "anthropic", "deepseek", "mcp"];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { message: "Invalid provider" },
        { status: 400 }
      );
    }
    
    await saveUserApiKey(user.id, provider as ApiProvider, apiKey);
    
    return NextResponse.json({ success: true, generatedKey: provider === "mcp" ? apiKey : undefined });
  } catch (error) {
    console.error("Error saving API key:", error);
    return NextResponse.json(
      { message: "Failed to save API key" },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/api-keys?provider=openai - Delete an API key for the current user
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");
    
    if (!provider) {
      return NextResponse.json(
        { message: "Provider is required" },
        { status: 400 }
      );
    }
    
    // Validate provider
    const validProviders = ["openai", "google", "anthropic", "deepseek", "mcp"];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { message: "Invalid provider" },
        { status: 400 }
      );
    }
    
    const success = await deleteUserApiKey(user.id, provider as ApiProvider);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { message: "Failed to delete API key" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json(
      { message: "Failed to delete API key" },
      { status: 500 }
    );
  }
}
