/**
 * Exercises the MCP server against a running app and the fake authorization
 * server. Verifies the parts that are easy to break silently: token
 * rejection, scope enforcement, the billable-work guards, and the output
 * shaping that keeps responses small.
 *
 *   node scripts/mcp/fake-authorization-server.mjs      # terminal 1
 *   npm run build && npm start                          # terminal 2
 *   node scripts/mcp/smoke-test.mjs                     # terminal 3
 */
import fs from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const BASE = process.env.MCP_BASE_URL || "http://localhost:3000";
const ENDPOINT = new URL(`${BASE}/api/mcp`);
const tokens = JSON.parse(
  fs.readFileSync(process.env.AS_TOKEN_FILE || path.join(process.cwd(), ".mcp-tokens.json"), "utf8")
);

let failures = 0;
function check(label, passed, detail = "") {
  console.log(`${passed ? "  ok  " : "  FAIL"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!passed) failures += 1;
}

async function connect(token) {
  const transport = new StreamableHTTPClientTransport(ENDPOINT, {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
  });
  const client = new Client({ name: "smoke-test", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);
  return { client, transport };
}

const parse = (result) => {
  try {
    return JSON.parse(result.content[0].text);
  } catch {
    return result.content?.[0]?.text;
  }
};

console.log("\nDiscovery");
const prm = await (await fetch(`${BASE}/.well-known/oauth-protected-resource`)).json();
check("metadata names an authorization server", Array.isArray(prm.authorization_servers) && prm.authorization_servers.length > 0);
check("metadata advertises scopes", (prm.scopes_supported || []).includes("jsa:generate"));

const anon = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
check("unauthenticated request is challenged", anon.status === 401);
check("challenge points at the metadata", (anon.headers.get("www-authenticate") || "").includes("resource_metadata="));

console.log("\nToken validation");
// Positive control first. Without it, a misconfigured run (wrong issuer, stale
// keys) rejects every token and the checks below pass for the wrong reason.
const control = await fetch(ENDPOINT, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    Authorization: `Bearer ${tokens.full}`,
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "control", version: "1" } },
  }),
});
check("a valid token is accepted", control.status === 200, `got ${control.status}`);
if (control.status !== 200) {
  console.log("\n  Refusing to continue: every later check would pass vacuously.");
  console.log("  Is the authorization server running, and does OAUTH_ISSUER match it?\n");
  process.exit(1);
}

for (const [name, token] of Object.entries(tokens)) {
  if (name === "read" || name === "full") continue;
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: "{}",
  });
  check(`${name} is rejected`, res.status === 401, `got ${res.status}`);
}

console.log("\nTools");
const { client, transport } = await connect(tokens.full);
const { tools } = await client.listTools();
check("all eight tools are advertised", tools.length === 8, `got ${tools.length}`);

const list = parse(await client.callTool({ name: "list_applications", arguments: { limit: 50 } }));
check("list_applications returns rows", Array.isArray(list.applications));
check("list rows omit job descriptions", !("jobDescription" in (list.applications[0] || {})));

const withDocs = list.applications.find((a) => a.hasDocuments);
if (withDocs) {
  const guard = await client.callTool({ name: "generate_documents", arguments: { applicationId: withDocs.id } });
  check("generate refuses to overwrite without regenerate", guard.isError === true && parse(guard).error?.code === "conflict");
}

const missing = await client.callTool({
  name: "get_application",
  arguments: { id: "00000000-0000-4000-8000-000000000000" },
});
check("unknown id is a structured not_found", missing.isError === true && parse(missing).error?.code === "not_found");

await transport.close();

console.log("\nScopes");
const ro = await connect(tokens.read);
const denied = await ro.client.callTool({ name: "generate_documents", arguments: { applicationId: list.applications[0].id } });
check("read-only token cannot generate", denied.isError === true);
const permitted = await ro.client.callTool({ name: "list_applications", arguments: { limit: 1 } });
check("read-only token can still read", !permitted.isError);
await ro.transport.close();

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
