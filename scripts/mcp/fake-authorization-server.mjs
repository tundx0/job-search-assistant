/**
 * A stand-in OAuth authorization server for local development.
 *
 * It publishes a JWKS and mints RS256 access tokens, which is enough to
 * exercise the resource server end to end — signature, issuer, audience,
 * expiry and scopes — without signing up for a provider.
 *
 * Not an authorization server: there is no authorization endpoint, no consent
 * and no PKCE. Never run this anywhere but a developer machine.
 *
 *   node scripts/mcp/fake-authorization-server.mjs
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { generateKeyPair, exportJWK, SignJWT, calculateJwkThumbprint } from "jose";

const PORT = Number(process.env.AS_PORT || 4500);
const ISSUER = process.env.OAUTH_ISSUER || `http://localhost:${PORT}`;
const RESOURCE = process.env.MCP_RESOURCE_URL || "http://localhost:3000/api/mcp";
const SUBJECT = process.env.AS_SUBJECT || "as|demo-user";
const OUT = process.env.AS_TOKEN_FILE || path.join(process.cwd(), ".mcp-tokens.json");

const { publicKey, privateKey } = await generateKeyPair("RS256", { extractable: true });
const jwk = await exportJWK(publicKey);
jwk.kid = await calculateJwkThumbprint(jwk);
jwk.alg = "RS256";
jwk.use = "sig";

function mint({ sub = SUBJECT, scopes, audience = RESOURCE, expiresIn = "1h", issuer = ISSUER }) {
  return new SignJWT({ scope: scopes.join(" ") })
    .setProtectedHeader({ alg: "RS256", kid: jwk.kid })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(privateKey);
}

const tokens = {
  read: await mint({ scopes: ["jsa:read"] }),
  full: await mint({ scopes: ["jsa:read", "jsa:generate"] }),
  // Tokens the resource server must refuse.
  wrongAudience: await mint({ scopes: ["jsa:read"], audience: "https://elsewhere.example/api/mcp" }),
  expired: await mint({ scopes: ["jsa:read"], expiresIn: "-1m" }),
  wrongIssuer: await mint({ scopes: ["jsa:read"], issuer: "http://localhost:9999" }),
  unlinkedSubject: await mint({ sub: "as|nobody", scopes: ["jsa:read"] }),
};

fs.writeFileSync(OUT, JSON.stringify(tokens, null, 2));

http
  .createServer((req, res) => {
    if (req.url === "/.well-known/jwks.json") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ keys: [jwk] }));
      return;
    }
    res.writeHead(404).end();
  })
  .listen(PORT, () => {
    console.log(`Fake authorization server listening on ${ISSUER}`);
    console.log(`  audience : ${RESOURCE}`);
    console.log(`  subject  : ${SUBJECT}`);
    console.log(`  tokens   : ${OUT}`);
  });
