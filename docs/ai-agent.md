# GameLayer Sales Agent API

This document describes the AI chat endpoint for the GameLayer Sales Agent.

## Overview

The Sales Agent is an AI-powered chat assistant that helps inbound prospects understand GameLayer, qualify their needs, and route high-intent leads to human sales representatives.

## Endpoint

**URL:** `/api/chat`  
**Method:** `POST`  
**Content-Type:** `application/json`

## Request Format

```json
{
  "message": "What is GameLayer?",
  "conversationId": "optional-conversation-id"
}
```

### Request Fields

- `message` (required, string): The user's message/question. Maximum length: 2000 characters. Will be trimmed and empty messages are rejected.
- `conversationId` (optional, string): UUID of an existing conversation. If omitted, a new conversation will be created and returned in the response.

## Response Format

### Success Response (200 OK)

```json
{
  "reply": "GameLayer is a gamification API platform that helps you...",
  "requestId": "uuid-here",
  "conversationId": "uuid-here"
}
```

**Response Fields:**
- `reply` (string): The AI assistant's response
- `requestId` (string): Unique request identifier for correlation and debugging
- `conversationId` (string): Conversation UUID - reuse this in subsequent requests to continue the conversation

Response includes rate limit headers:
- `X-RateLimit-Limit`: Maximum requests per window (30)
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: ISO timestamp when the rate limit resets

### Error Responses

**400 Bad Request** - Invalid input
```json
{
  "error": "Message is required and must be a string",
  "requestId": "uuid-here"
}
```

**405 Method Not Allowed** - Wrong HTTP method
```json
{
  "error": "Method not allowed",
  "requestId": "uuid-here"
}
```

**429 Too Many Requests** - Rate limit exceeded
```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "requestId": "uuid-here"
}
```
Response includes rate limit headers:
- `X-RateLimit-Limit`: Maximum requests per window (30)
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: ISO timestamp when the rate limit resets

**500 Internal Server Error** - Server configuration issue
```json
{
  "error": "Server configuration error",
  "requestId": "uuid-here"
}
```

**502 Bad Gateway** - OpenAI API error
```json
{
  "error": "Failed to get response from AI service",
  "requestId": "uuid-here"
}
```

## Environment Variables

### Required

- `OPENAI_API_KEY`: Your OpenAI API key for the Responses API

### Required for Data Persistence

- `SUPABASE_URL`: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (server-only, never exposed to clients)

**Note:** The service role key is used server-side only to bypass RLS and persist conversations, messages, and lead data. It is never exposed in API responses or logs.

### Optional

- `SUPABASE_ANON_KEY`: Supabase anonymous key (not currently used, reserved for future client-side features)

## Debug Flags

The following environment variables control debug behavior and should be **disabled in production** unless diagnosing issues:

- `DEBUG_OPENAI=true`: Enables detailed logging for OpenAI API requests and responses. Logs include:
  - Conversation history count and roles
  - Request body summary (model, message count, content types)
  - OpenAI response output types
  - **Note:** Never logs message text or secrets
  
- `REQUIRE_SUPABASE=true`: When enabled, the API will return HTTP 500 errors if Supabase persistence operations fail. When disabled (default), the API continues to function even if Supabase is unavailable (data is not persisted).

**Production Recommendation:** Leave both unset (defaults to `false`) unless actively debugging issues.

## Local Development Setup

1. Create a `.env` file in the project root:

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

2. For Vercel deployment, add the environment variable in the Vercel dashboard:
   - Go to your project settings → Environment Variables
   - Add `OPENAI_API_KEY` with your OpenAI API key

3. Start the development server:

```bash
npm run dev
```

The endpoint will be available at `http://localhost:4321/api/chat`

## Example Usage

### Using curl

**First request (creates new conversation):**
```bash
curl -X POST http://localhost:4321/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is GameLayer?"
  }'
```

**Response:**
```json
{
  "reply": "GameLayer is a gamification API platform...",
  "requestId": "abc-123-def",
  "conversationId": "xyz-789-uvw"
}
```

**Second request (continues existing conversation):**
```bash
curl -X POST http://localhost:4321/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about pricing",
    "conversationId": "xyz-789-uvw"
  }'
```

### Using JavaScript/TypeScript

```typescript
// First request - create new conversation
let conversationId: string | undefined;

const response1 = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'What is GameLayer?'
  })
});

const data1 = await response1.json();
console.log(data1.reply);
conversationId = data1.conversationId; // Save for next request

// Second request - continue conversation
const response2 = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Tell me about pricing',
    conversationId: conversationId // Reuse conversation ID
  })
});

const data2 = await response2.json();
console.log(data2.reply);
```

## Implementation Details

- **AI Model:** `gpt-4.1-mini` (OpenAI Responses API)
- **API Endpoint:** `https://api.openai.com/v1/responses`
- **No streaming:** Returns complete JSON response (streaming support to be added in future)
- **Input validation:** Message is required, trimmed, max 2000 characters (empty after trimming is rejected)
- **Error handling:** All errors return safe, user-friendly messages with `requestId` for correlation
- **Request correlation:** Every request gets a unique `requestId` (UUID) for logging and debugging
- **Logging:** Structured logs include requestId, IP, timestamp, status, latency, and message length (never logs sensitive data like API keys or full message content)

## Data Persistence

The API automatically persists all conversations, messages, and lead signals to Supabase:

- **Conversations:** Created automatically on first message, updated with `last_active_at` on each interaction
- **Messages:** All user and assistant messages are stored with role, content, and requestId
- **Leads:** Lead qualification data is automatically extracted and stored:
  - `intent_score`: Computed from message content (0-100)
  - `handoff_requested`: Set to true if message contains handoff keywords
  - `last_summary`: One-sentence summary of the user's latest message

**Lead Signal Computation:**
- +20 points: Pricing/demo keywords (pricing, price, demo, cost, purchase, buy)
- +15 points: Integration keywords (integrate, integration, api, sdk, connect, implement)
- +15 points: Scale indicators (MAU, users, numbers with k/m suffix like "50k", "2m")
- +10 points: Urgency keywords (this month, this quarter, soon, urgent, asap)
- Handoff requested: Keywords like call, meeting, email, talk, sales, demo, contact

All database operations use the `SUPABASE_SERVICE_ROLE_KEY` server-side only, ensuring RLS remains enabled while allowing full access from the application server.

## Rate Limiting

The endpoint implements per-IP rate limiting:

- **Limit:** 30 requests per 10 minutes per IP address
- **Response:** Returns `429 Too Many Requests` when limit is exceeded
- **Headers:** All responses include rate limit information in headers

### Serverless Limitations (v1)

The current implementation uses an in-memory Map for rate limiting, which has the following limitations in serverless environments:

- **Per-instance limits:** Each serverless function instance maintains its own rate limit map (not shared across instances)
- **Cold starts:** Rate limits reset when a new function instance starts (cold start)
- **Scalability:** Not suitable for high-traffic production at scale

**For production at scale:** Consider migrating to a shared store (Redis, DynamoDB, or similar) for distributed rate limiting across all function instances.

**For local development:** The in-memory approach works perfectly and provides accurate rate limiting.

## Knowledge Base

The Sales Agent uses a two-part knowledge base:

### Phase 1: Markdown Knowledge Pack
Narrative content stored in `src/knowledge/*.md` files covering:
- GameLayer core concepts and positioning
- Differentiators and build vs buy
- Mechanics overview
- Constraints and clarifications

### Phase 2: OpenAPI Knowledge Base
API capabilities parsed from `/docs/gamelayer.yaml` and stored in Supabase:
- **Tables:** `kb_openapi_endpoints`, `kb_openapi_tags`
- **Ingestion:** Run `npm run kb:ingest:openapi` to parse YAML and populate tables
- **Retrieval:** Agent searches endpoints based on user questions
- **Authority:** YAML is authoritative for "can GameLayer do X?" questions

### Setup

1. **Run migration:**
   ```sql
   -- In Supabase SQL Editor, run:
   -- supabase/migrations/002_kb_openapi.sql
   ```

2. **Ingest OpenAPI YAML:**
   ```bash
   npm run kb:ingest:openapi
   ```
   Requires: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables

3. **Verify:**
   ```sql
   SELECT COUNT(*) FROM kb_openapi_endpoints;
   SELECT COUNT(*) FROM kb_openapi_tags;
   ```

**Note:** The YAML file (`/docs/gamelayer.yaml`) is the authoritative source for API capabilities. The agent will not claim support for features not present in the parsed API context.

## Agent Behavior

The Sales Agent is configured to:
- Answer accurately from provided context
- Use API Context as authoritative source for capability questions
- Qualify leads by asking focused questions
- Recommend next steps
- Escalate to human for pricing, legal, security, SLAs, custom terms, or uncertain topics
- Never invent features or negotiate pricing
- Keep responses concise (3-8 sentences)
- Start new chats with an intro and discovery question

## Notes

- **Conversation persistence:** All conversations are automatically persisted to Supabase
- **RLS security:** Row Level Security remains enabled; the server uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS (server-only, never exposed)
- **Graceful degradation:** If Supabase is unavailable, the API continues to function but data is not persisted
- **Future enhancements:** Conversation history retrieval, streaming responses, and enhanced lead qualification features

## Admin Routes Protection

The `/admin/*` routes (e.g., `/admin/leads`) are protected with HTTP Basic Authentication in production.

### Setup

Set the `ADMIN_PASSWORD` environment variable in Vercel:
1. Go to your Vercel project settings → Environment Variables
2. Add `ADMIN_PASSWORD` with your desired password
3. Redeploy the application

**Note:** If `ADMIN_PASSWORD` is not set, admin routes are accessible without authentication (useful for local development).

### Usage

When accessing `/admin/*` routes, browsers will prompt for credentials:
- **Username:** Can be anything (e.g., "admin")
- **Password:** Must match the `ADMIN_PASSWORD` environment variable

### Example with curl

```bash
curl -u admin:your-password https://your-domain.com/admin/leads
```

Or with explicit Basic Auth header:
```bash
curl -H "Authorization: Basic $(echo -n 'admin:your-password' | base64)" \
  https://your-domain.com/admin/leads
```

