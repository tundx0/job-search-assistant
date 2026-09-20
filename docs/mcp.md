# MCP server

The app exposes a Model Context Protocol server at `/api/mcp` so an agent can
read applications, draft documents and track a job search on the user's behalf.

It is an **OAuth 2.1 Resource Server**. It validates access tokens; it never
issues them. Token issuance belongs to a separate authorization server.

## Configuration

| Variable | Required | Meaning |
| --- | --- | --- |
| `MCP_RESOURCE_URL` | yes | Canonical URL of this MCP endpoint, e.g. `https://example.com/api/mcp`. Clients send it as the RFC 8707 `resource` parameter and the authorization server stamps it into the token audience. Must match exactly. |
| `OAUTH_ISSUER` | yes | Issuer URL of the authorization server, matched against the token `iss`. |
| `OAUTH_JWKS_URI` | no | Defaults to `<OAUTH_ISSUER>/.well-known/jwks.json`. |
| `MCP_MAX_GENERATIONS` | no | Billable operations one server process will perform. Default 5. |

The server refuses to start without the first two. A resource server that
cannot name its own issuer and audience cannot validate anything, and
accepting tokens anyway would be worse than failing.

## How a client connects

1. The client calls `/api/mcp` with no token and gets `401` plus
   `WWW-Authenticate: Bearer resource_metadata="…"`.
2. It fetches `/.well-known/oauth-protected-resource` (RFC 9728) and reads
   `authorization_servers`.
3. It runs the OAuth flow against that server, sending `resource` so the token
   is bound to this MCP endpoint.
4. It retries with `Authorization: Bearer <token>`.

## Scopes

| Scope | Grants |
| --- | --- |
| `jsa:read` | Read applications, documents and profile; create applications and change status. |
| `jsa:generate` | Draft documents and score them. **Spends the account's AI provider credit.** |

`jsa:generate` is separate so a triage agent can be given a token that cannot
spend money.

## Account linking

Tokens are resolved to a local account through `User.authSubject`, never by
the token's email claim. Unless the authorization server guarantees verified
addresses, matching on email would let anyone who registers a matching address
there inherit the account, its documents and its stored provider API key.

Linking is an explicit action taken by a signed-in user in the web app
(`linkAccount` in `src/lib/mcp/account.ts`).

## Tools

| Tool | Scope | Cost |
| --- | --- | --- |
| `list_applications` | read | free |
| `get_application` | read | free |
| `get_profile` | read | free |
| `get_document` | read | free |
| `create_application` | read | free |
| `update_application_status` | read | free |
| `generate_documents` | generate | **billable** |
| `score_application` | generate | **billable** when `refresh` is true |

Two habits keep responses small: list rows never carry job description text,
and `get_application` previews the description unless `full: true`. On a
typical 3 KB posting that is a ~94% saving per row.

### Guards on billable work

- `generate_documents` refuses to overwrite existing documents unless
  `regenerate: true`. Client approval prompts are not a cost control: the user
  approves one call and the loop happens inside it.
- `MCP_MAX_GENERATIONS` caps billable operations per server process.
- Scoring failures return `strengthScore: null` with `scoringFailed: true`,
  rather than a placeholder that cannot be told apart from a real score.

## Verifying locally

There is no need for a provider account to exercise this. A stand-in
authorization server mints real RS256 tokens against a local JWKS:

```bash
# terminal 1 — publishes a JWKS, writes .mcp-tokens.json
MCP_RESOURCE_URL=http://localhost:3000/api/mcp \
OAUTH_ISSUER=http://localhost:4500 \
npm run mcp:auth-server

# terminal 2 — the app, pointed at that issuer
npm run build && npm start

# terminal 3
npm run mcp:smoke
```

Link the account you want to test first:

```sql
UPDATE "User"
SET "authSubject" = 'as|demo-user', "authIssuer" = 'http://localhost:4500'
WHERE email = 'you@example.com';
```

The smoke test checks discovery, the challenge header, token rejection
(wrong audience, expired, wrong issuer, unlinked subject), scope enforcement
and the overwrite guard. It begins with a positive control: if a valid token
is not accepted, it stops rather than letting the rejection checks pass
vacuously.

## Choosing an authorization server

The MCP spec's 2026-07-28 revision deprecated Dynamic Client Registration in
favour of Client ID Metadata Documents and requires clients to validate `iss`
(RFC 9207). Pick a provider current with that revision.

RFC 8707 resource indicator support is the binding constraint — without it the
authorization server cannot bind a token to this endpoint, and audience
validation here will reject everything it issues.
