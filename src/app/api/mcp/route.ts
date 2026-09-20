import { createMcpHandler } from "mcp-handler";
import { registerMcpTools } from "@/lib/mcp/tools";
import { getUserApiKey } from "@/lib/api-keys/user-api-keys";

// Initialize the MCP handler
const mcpHandler = createMcpHandler((server) => {
  registerMcpTools(server);
});

// Middleware to enforce multi-tenant API Key authentication
const withAuth = (handlerFn: (req: Request) => Promise<Response>) => async (req: Request) => {
  const authHeader = req.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer mcp_")) {
    console.error("MCP Unauthorized Access Attempt: Missing or invalid token format");
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  const token = authHeader.replace("Bearer ", "");
  
  // Parse the userId from the token format: mcp_<userId>_<secret>
  const parts = token.split("_");
  if (parts.length < 3) {
    return new Response(JSON.stringify({ error: "Invalid token format" }), { status: 401 });
  }
  
  const userId = parts[1];
  
  try {
    const storedDecryptedKey = await getUserApiKey(userId, "mcp");
    
    if (!storedDecryptedKey || storedDecryptedKey !== token) {
      console.error(`MCP Unauthorized Access Attempt: Invalid key for user ${userId}`);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    
    // We can pass the authenticated userId down via headers or context if the library supported it.
    // Instead, since mcp-handler doesn't easily expose context, the tool implementations will extract 
    // it directly from the request headers using Next.js `headers()`.
    
    return handlerFn(req);
  } catch (error) {
    console.error("Error validating MCP API Key:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
};

// Handle both GET (for SSE stream connection) and POST (for RPC messages)
export const GET = withAuth(mcpHandler);
export const POST = withAuth(mcpHandler);
