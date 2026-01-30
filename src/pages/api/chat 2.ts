import type { APIRoute } from 'astro';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import {
  createConversation,
  touchConversation,
  insertMessage,
  upsertLead,
  getRecentMessages,
  getLead,
  searchOpenApiEndpoints
} from '../../lib/supabaseAdmin';

// Load Knowledge Pack from markdown files
function loadKnowledgePack(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    // From src/pages/api/chat.ts, go up 2 levels to src/, then into knowledge/
    const knowledgeDir = join(__filename, '..', '..', 'knowledge');
    
    const knowledgeFiles = [
      'gamelayer-core.md',
      'differentiators.md',
      'build-vs-buy.md',
      'mechanics.md',
      'constraints.md'
    ];
    
    const knowledgeParts: string[] = [];
    
    for (const filename of knowledgeFiles) {
      try {
        const filePath = join(knowledgeDir, filename);
        const content = readFileSync(filePath, 'utf-8');
        knowledgeParts.push(`--- GameLayer KB: ${filename} ---\n${content}`);
      } catch (error) {
        // Log but don't fail if a file is missing
        console.warn(`[CHAT_API] Could not load knowledge file: ${filename}`, error);
      }
    }
    
    return knowledgeParts.join('\n\n');
  } catch (error) {
    console.error('[CHAT_API] Error loading knowledge pack:', error);
    return ''; // Return empty string if KB loading fails
  }
}

// Load knowledge pack once at module initialization
const KNOWLEDGE_PACK = loadKnowledgePack();

// System prompt for GameLayer Sales Agent
const SYSTEM_PROMPT_BASE = `You are the GameLayer Sales Agent.

Goal
Help prospective customers understand whether GameLayer is a good fit, recommend the right gamification mechanics for their product, and guide them to the next step (usually a demo) when intent is high.

What GameLayer is
GameLayer is a developer-first gamification API platform. It provides composable mechanics (e.g., missions, progression, rewards, leaderboards, streaks) that can be integrated into an existing product and tech stack.

What GameLayer is NOT
- Not a generic "chatbot support agent"
- Not a full loyalty CRM or marketing automation suite
- Do not claim features, endpoints, integrations, or customers unless they are explicitly provided in the Knowledge Context or the user states them.

Critical rules (no hallucinations)
- Treat the Knowledge Context as the source of truth for GameLayer-specific claims.
- Treat the API Context as the authoritative source for "can GameLayer do X?" questions.
- If the user asks whether GameLayer supports something, rely on API Context.
- Do not claim support for capabilities not present in API Context or the Knowledge Pack.
- Do not claim features, pricing, customers, or integrations not present in the Knowledge Context or explicitly stated by the user.
- If something is not covered, ask a clarifying question or suggest a demo.
- If you are unsure about a GameLayer capability, pricing detail, SLA, integration, or roadmap: say so and ask a clarifying question or suggest a demo.
- Only use factual claims about GameLayer that are included in the Knowledge Context (if present) or directly stated by the user.
- Do not invent numbers, customer names, case studies, or "we already support X" statements.

API Authority
If the user asks whether GameLayer supports a specific feature, program, or capability (e.g. referrals, coupons, tiers):
- The agent must answer explicitly whether this is supported or cannot be confirmed based on API Context.
- The agent must not imply support by redirecting to other mechanics unless clearly framed as an alternative.
- When a capability is NOT present in API Context, the first sentence MUST be exactly: "I can't confirm native support for this from the current API."
- The second sentence may specify the capability name, but must not imply support.
- When discussing alternatives for unsupported capabilities, use "can sometimes be modeled" or "may be modeled", and avoid language like "supports" or "incentivize in creative ways" that could imply native support.

Conversation style
- Be concise, warm, and practical. Avoid buzzwords.
- Prefer mechanics and "starter loop concepts" over generic advice.
- Offer 2–4 concrete mechanics and explain why they fit the stated goal.
- Ask the minimum number of high-signal questions.

Starter Loop Guidance
- When suggesting starter loop concepts or example loops, the agent should treat them as conceptual examples, not prebuilt or production-ready solutions.
- Use "starter loop concept" or "example loop" terminology, not "starter loop" alone, to emphasize these are conceptual.
- Starter loop concepts must only reference mechanics that exist in the GameLayer API.
- Concrete implementations such as referral systems, coupons, vouchers, or discounts must not be introduced unless explicitly framed as external outcomes handled outside GameLayer.
- When mentioning rewards in starter loops, describe them abstractly (e.g. "a reward granted via your existing system") rather than specific benefit types.

Discovery questions (use as needed)
Prioritize these in order:
1) What are you building and what industry?
2) Who are the users (B2C/B2B, new vs returning) and what behavior should increase?
3) What is the primary goal (activation, retention, repeat purchase, referrals)?
4) Scale (MAU/users) and timeline
5) Constraints (platforms, data, integration preferences)

Recommendations framework
- Translate goals → mechanics → suggest a simple starter loop concept (conceptual example, not prebuilt).
Examples:
- Activation: onboarding missions + early rewards + gentle progression
- Retention: streaks + missions + progression + periodic rewards
- Loyalty: tiered progression + personalized missions + rewards/benefits
- Community: teams + leaderboards + collaborative missions

Build vs buy positioning (when relevant)
If the user suggests building in-house or comparing competitors:
- Explain that building gamification is not just UI; it includes rules, progression logic, analytics, abuse prevention, experimentation, admin tooling, and maintenance.
- Position GameLayer as a faster, flexible, API-first approach that keeps them in control of their UX while reducing engineering overhead.
- Keep this factual and non-attacky.

Handoff behavior
If the user expresses high intent (e.g., "demo", "pricing", "meeting", "this quarter", "contact"):
- Acknowledge and move toward scheduling.
- Ask only what's needed to tailor the demo (platforms, goals, scale, timeline).
- When suggesting a demo, be explicit that this is a tailored walkthrough with a human, prepared using the context gathered in the conversation.
- Provide a clear next step.

Output format
Return a helpful answer in plain text. Use short paragraphs and bullet points when useful.`;

// Combine base prompt with knowledge pack
function getSystemPrompt(): string {
  if (KNOWLEDGE_PACK) {
    return `${SYSTEM_PROMPT_BASE}

GameLayer Knowledge Context (authoritative)
${KNOWLEDGE_PACK}`;
  }
  return SYSTEM_PROMPT_BASE;
}

const SYSTEM_PROMPT = getSystemPrompt();

// Configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODEL = 'gpt-4.1-mini';
const MAX_MESSAGE_LENGTH = 2000; // Reasonable limit for chat messages
const REQUIRE_SUPABASE = process.env.REQUIRE_SUPABASE === 'true'; // Default: false (set to "true" to require Supabase persistence)

// Rate limiting configuration
const RATE_LIMIT_REQUESTS = 30; // requests per window
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

// In-memory rate limit store
// NOTE: This works for local dev and v1 on serverless, but has limitations:
// - Each serverless function instance has its own Map (not shared across instances)
// - Rate limits reset on cold starts
// - For production at scale, consider Redis or a shared store
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

interface ChatRequest {
  message: string;
  conversationId?: string;
}

interface ChatResponse {
  reply: string;
  requestId: string;
  conversationId: string;
}

interface ErrorResponse {
  error: string;
  requestId?: string;
  details?: string;
}

interface OpenAIError {
  error?: {
    message?: string;
    type?: string;
  };
}

// Helper to extract client IP from request
function getClientIP(request: Request): string {
  // Check various headers for IP (handles proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  // Fallback (won't work in serverless, but helps local dev)
  return 'unknown';
}

// Helper to check and update rate limit
function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || entry.resetAt < now) {
    // Create new entry or reset expired one
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_REQUESTS - 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    };
  }

  if (entry.count >= RATE_LIMIT_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_REQUESTS - entry.count,
    resetAt: entry.resetAt
  };
}

// Helper to convert text to OpenAI Responses API input content format
// Request content items must use type "input_text" for system/user, "output_text" for assistant
function toInputContent(text: string): Array<{ type: 'input_text'; text: string }> {
  return [{ type: 'input_text', text }];
}

// Helper to convert text to role-aware content format for OpenAI Responses API
// - System and user messages: use "input_text"
// - Assistant messages (from history): use "output_text"
function toRoleAwareContent(text: string, role: 'system' | 'user' | 'assistant'): Array<{ type: 'input_text' | 'output_text'; text: string }> {
  if (role === 'assistant') {
    return [{ type: 'output_text', text }];
  }
  // system and user use input_text
  return [{ type: 'input_text', text }];
}

// Helper to safely extract text from OpenAI Responses API
// ONLY traverses resp.output (NOT resp.input)
// Silently ignores all unknown content types (including 'input_text')
function extractTextFromResponsesAPI(respJson: any): string {
  try {
    // Only process output field, never input
    if (!respJson?.output || !Array.isArray(respJson.output)) {
      console.error('No output array found in response');
      return 'Sorry — I couldn\'t generate a response.';
    }

    const textParts: string[] = [];
    
    // Iterate through output items
    for (const outputItem of respJson.output) {
      // Check if this output item has content array
      if (outputItem?.content && Array.isArray(outputItem.content)) {
        for (const contentPart of outputItem.content) {
          // Only process contentPart.type === 'output_text'
          // All other types (including 'input_text', 'refusal', and any unknown types) are silently ignored
          if (contentPart?.type === 'output_text') {
            // Extract text from contentPart.text property
            if (typeof contentPart.text === 'string' && contentPart.text.length > 0) {
              textParts.push(contentPart.text);
            }
          }
          // Explicitly ignore all other types without throwing or logging
          // This includes: 'input_text', 'refusal', and any unknown types
        }
      }
    }
    
    // If we found text parts, concatenate them
    if (textParts.length > 0) {
      return textParts.join('\n');
    }

    // No text found - return safe fallback
    console.error('No output_text found in response structure:', JSON.stringify(respJson, null, 2).substring(0, 500));
    return 'Sorry — I couldn\'t generate a response.';
  } catch (error) {
    // Catch any unexpected errors and return fallback (never throw)
    console.error('Error in extractTextFromResponsesAPI:', error);
    return 'Sorry — I couldn\'t generate a response.';
  }
}

// Helper to compute lead signals from user message
function computeLeadSignals(message: string): {
  intent_score: number;
  handoff_requested: boolean;
  last_summary: string;
} {
  const lowerMessage = message.toLowerCase();
  let intent_score = 0;

  // Pricing/demo signals (+20)
  if (/\b(pricing|price|demo|cost|purchase|buy)\b/.test(lowerMessage)) {
    intent_score += 20;
  }

  // Integration/API signals (+15)
  if (/\b(integrate|integration|api|sdk|connect|implement)\b/.test(lowerMessage)) {
    intent_score += 15;
  }

  // Scale signals - MAU, users, or numbers with k/m suffix (+15)
  if (/\b(mau|users|user base)\b/.test(lowerMessage) || 
      /\b\d+[km]\b/.test(lowerMessage) || 
      /\b\d+\s*(thousand|million|k|m)\b/.test(lowerMessage)) {
    intent_score += 15;
  }

  // Urgency signals (+10)
  if (/\b(this month|this quarter|soon|urgent|asap|quickly|immediately)\b/.test(lowerMessage)) {
    intent_score += 10;
  }

  // Cap at 100
  intent_score = Math.min(intent_score, 100);

  // Handoff signals
  const handoff_requested = /\b(call|meeting|email|talk|sales|demo|contact|speak|schedule)\b/.test(lowerMessage);

  // Create a simple summary (first sentence or first 100 chars)
  const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const last_summary = sentences.length > 0 
    ? sentences[0].trim().substring(0, 150) 
    : message.trim().substring(0, 150);

  return {
    intent_score,
    handoff_requested,
    last_summary
  };
}

// Helper to log request (never logs sensitive data)
function logRequest(
  requestId: string,
  ip: string,
  status: number,
  latencyMs: number,
  messageLength: number,
  error?: string
) {
  const logEntry = {
    requestId,
    ip,
    timestamp: new Date().toISOString(),
    status,
    latencyMs: Math.round(latencyMs),
    messageLength,
    ...(error && { error })
  };
  
  // Use console.log for structured logging (can be captured by logging services)
  if (status >= 400) {
    console.error('[CHAT_API]', JSON.stringify(logEntry));
  } else {
    console.log('[CHAT_API]', JSON.stringify(logEntry));
  }
}

// GET handler - returns API information
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      message: 'GameLayer Sales Agent API',
      endpoint: '/api/chat',
      method: 'POST',
      description: 'Send a POST request with JSON body: {"message": "your question here"}',
      example: {
        request: {
          message: 'What is GameLayer?'
        },
        response: {
          reply: 'GameLayer is a gamification API platform...',
          requestId: 'uuid-here'
        }
      },
      documentation: '/docs/ai-agent.md'
    }, null, 2),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
};

export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  const requestId = randomUUID();
  const ip = getClientIP(request);
  const DEBUG_ENABLED = process.env.DEBUG_OPENAI === 'true';

  try {
    // Validate request method
    if (request.method !== 'POST') {
      const latencyMs = Date.now() - startTime;
      logRequest(requestId, ip, 405, latencyMs, 0, 'Method not allowed');
      return new Response(
        JSON.stringify({ error: 'Method not allowed', requestId } as ErrorResponse),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      const latencyMs = Date.now() - startTime;
      logRequest(requestId, ip, 429, latencyMs, 0, 'Rate limit exceeded');
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please try again later.',
          requestId
        } as ErrorResponse),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(RATE_LIMIT_REQUESTS),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString()
          }
        }
      );
    }

    // Parse and validate request body
    let body: ChatRequest;
    try {
      body = await request.json();
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      logRequest(requestId, ip, 400, latencyMs, 0, 'Invalid JSON');
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', requestId } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate and sanitize message
    if (!body.message || typeof body.message !== 'string') {
      const latencyMs = Date.now() - startTime;
      logRequest(requestId, ip, 400, latencyMs, 0, 'Message missing or invalid type');
      return new Response(
        JSON.stringify({ error: 'Message is required and must be a string', requestId } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Trim and validate message
    const trimmedMessage = body.message.trim();
    if (trimmedMessage.length === 0) {
      const latencyMs = Date.now() - startTime;
      logRequest(requestId, ip, 400, latencyMs, 0, 'Message empty after trimming');
      return new Response(
        JSON.stringify({ error: 'Message cannot be empty', requestId } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      const latencyMs = Date.now() - startTime;
      logRequest(requestId, ip, 400, latencyMs, trimmedMessage.length, 'Message exceeds max length');
      return new Response(
        JSON.stringify({
          error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`,
          requestId
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Determine or create conversation ID
    let conversationId: string;
    try {
      if (body.conversationId && typeof body.conversationId === 'string') {
        conversationId = body.conversationId;
      } else {
        // Create new conversation
        conversationId = await createConversation();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CHAT_API] Failed to create/get conversation:', errorMessage);
      
      if (REQUIRE_SUPABASE) {
        const latencyMs = Date.now() - startTime;
        logRequest(requestId, ip, 500, latencyMs, trimmedMessage.length, `Supabase persistence failed: ${errorMessage}`);
        return new Response(
          JSON.stringify({
            error: 'Supabase persistence failed',
            requestId,
            details: errorMessage
          } as ErrorResponse),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      conversationId = randomUUID(); // Fallback to local UUID
    }

    // Store user message
    try {
      await insertMessage(conversationId, 'user', trimmedMessage, requestId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CHAT_API] Failed to store user message:', errorMessage);
      
      if (REQUIRE_SUPABASE) {
        const latencyMs = Date.now() - startTime;
        logRequest(requestId, ip, 500, latencyMs, trimmedMessage.length, `Supabase persistence failed: ${errorMessage}`);
        return new Response(
          JSON.stringify({
            error: 'Supabase persistence failed',
            requestId,
            details: errorMessage
          } as ErrorResponse),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      // Continue without failing the request if REQUIRE_SUPABASE is false
    }

    // Check for API key
    const apiKey = import.meta.env.OPENAI_API_KEY;
    if (!apiKey) {
      const latencyMs = Date.now() - startTime;
      logRequest(requestId, ip, 500, latencyMs, trimmedMessage.length, 'OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error', requestId } as ErrorResponse),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch conversation history right before building OpenAI request
    // (History includes the current user message we just stored)
    let history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    try {
      history = await getRecentMessages(conversationId, 12);
    } catch (error) {
      // History fetch failures are non-critical - log but continue
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CHAT_API] Failed to fetch conversation history:', errorMessage);
      // Continue with empty history
    }

    // Debug logging (only if DEBUG_OPENAI env var is exactly "true")
    if (DEBUG_ENABLED) {
      console.log(JSON.stringify({
        historyCount: history.length,
        historyRoles: history.map(m => m.role).slice(-12)
      }, null, 2));
    }

    // Safeguard: If combined history content is huge, truncate to last 8 messages
    const MAX_HISTORY_LENGTH = 10000; // Approximate character limit
    let totalLength = history.reduce((sum, msg) => sum + msg.content.length, 0);
    if (totalLength > MAX_HISTORY_LENGTH && history.length > 8) {
      history = history.slice(-8);
      console.warn(`[CHAT_API] Conversation history truncated to last 8 messages due to size`);
    }

    // Search for relevant API endpoints based on user message
    let apiContext = '';
    try {
      const endpoints = await searchOpenApiEndpoints(trimmedMessage, 8);
      if (endpoints.length > 0) {
        const endpointLines = endpoints.map(ep => {
          let line = `- [${ep.method}] ${ep.path}`;
          if (ep.summary) {
            line += ` — ${ep.summary}`;
          }
          if (ep.tags && ep.tags.length > 0) {
            line += `\n  tags: ${ep.tags.join(', ')}`;
          }
          if (ep.deprecated) {
            line += `\n  notes: deprecated=true`;
          }
          if (ep.description) {
            // Truncate description to 1-2 lines (first 200 chars)
            const desc = ep.description.split('\n')[0].substring(0, 200);
            if (desc.length < ep.description.length) {
              line += `\n  description: ${desc}...`;
            } else {
              line += `\n  description: ${desc}`;
            }
          }
          return line;
        });
        apiContext = `GameLayer API Context (from OpenAPI /docs/gamelayer.yaml):\n${endpointLines.join('\n')}`;
      }
    } catch (error) {
      // Non-critical: log but continue without API context
      console.error('[CHAT_API] Failed to search API endpoints:', error);
    }

    // Build system prompt with API context if available
    let systemPromptText = SYSTEM_PROMPT;
    if (apiContext) {
      systemPromptText = `${SYSTEM_PROMPT}

GameLayer API Context (authoritative for capabilities)
${apiContext}`;
    }

    // Prepare OpenAI request with conversation history
    // OpenAI Responses API: 
    // - System and user messages: use type "input_text"
    // - Assistant messages (from history): use type "output_text"
    const inputMessages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: Array<{ type: 'input_text' | 'output_text'; text: string }>;
    }> = [
      {
        role: 'system',
        content: toInputContent(systemPromptText)
      }
    ];

    // Add conversation history (excluding system messages from history)
    // Use role-aware content mapping: assistant messages use output_text, user messages use input_text
    for (const msg of history) {
      if (msg.role !== 'system') {
        inputMessages.push({
          role: msg.role,
          content: toRoleAwareContent(msg.content, msg.role)
        });
      }
    }

    // Simplified duplication logic:
    // If we inserted the current user message into DB first, then history will include it.
    // Therefore do NOT append current user message manually when historyCount > 0.
    // Only append it manually if historyCount === 0 (history read failed).
    if (history.length === 0) {
      // History fetch failed or conversation is new - add current message manually
      inputMessages.push({
        role: 'user',
        content: toInputContent(trimmedMessage)
      });
    }

    const requestBody = {
      model: OPENAI_MODEL,
      input: inputMessages
    };

    // Debug logging (only if DEBUG_OPENAI env var is set)
    if (DEBUG_ENABLED) {
      // Log redacted summary of request body
      const debugSummary = {
        model: requestBody.model,
        inputMessageCount: requestBody.input.length,
        firstMessages: requestBody.input.slice(0, 5).map(msg => ({
          role: msg.role,
          contentTypes: msg.content.map(c => c.type),
          textLen: msg.content.reduce((sum, c) => sum + (c.text?.length || 0), 0)
        }))
      };
      console.log(JSON.stringify({ requestBodySummary: debugSummary }, null, 2));
    }

    // Call OpenAI Responses API
    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    // Read response as text first (before parsing JSON)
    const responseBodyText = await openaiResponse.text();

    // Handle non-2xx responses
    if (!openaiResponse.ok) {
      // Debug logging (only if DEBUG_OPENAI env var is set)
      if (DEBUG_ENABLED) {
        console.log(JSON.stringify({
          OPENAI_NON_2XX: {
            status: openaiResponse.status,
            statusText: openaiResponse.statusText,
            bodyText: responseBodyText
          }
        }, null, 2));
      }

      // Truncate details to 1500 chars
      const details = `${openaiResponse.status} ${openaiResponse.statusText} ${responseBodyText}`.substring(0, 1500);

      const latencyMs = Date.now() - startTime;
      logRequest(
        requestId,
        ip,
        500,
        latencyMs,
        trimmedMessage.length,
        `OpenAI request failed: ${details.substring(0, 200)}`
      );

      return new Response(
        JSON.stringify({
          error: 'OpenAI request failed',
          requestId,
          details
        } as ErrorResponse),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse OpenAI response JSON (2xx response)
    let openaiData: any;
    try {
      openaiData = JSON.parse(responseBodyText);
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      logRequest(requestId, ip, 502, latencyMs, trimmedMessage.length, 'Failed to parse OpenAI JSON response');
      return new Response(
        JSON.stringify({
          error: 'Failed to parse AI service response',
          requestId
        } as ErrorResponse),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Debug logging for successful responses (only if DEBUG_OPENAI env var is set)
    if (DEBUG_ENABLED) {
      const outputTypes = openaiData?.output?.flatMap((o: any) => 
        (o.content || []).map((c: any) => c.type)
      ) || [];
      console.log(JSON.stringify({ OPENAI_OK_OUTPUT_TYPES: outputTypes }, null, 2));
    }

    // Extract reply text using robust helper
    // Function now always returns a string (never null) - either extracted text or fallback message
    const reply = extractTextFromResponsesAPI(openaiData);

    // Store assistant message
    try {
      await insertMessage(conversationId, 'assistant', reply, requestId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CHAT_API] Failed to store assistant message:', errorMessage);
      
      if (REQUIRE_SUPABASE) {
        const latencyMs = Date.now() - startTime;
        logRequest(requestId, ip, 500, latencyMs, trimmedMessage.length, `Supabase persistence failed: ${errorMessage}`);
        return new Response(
          JSON.stringify({
            error: 'Supabase persistence failed',
            requestId,
            details: errorMessage
          } as ErrorResponse),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      // Continue without failing the request if REQUIRE_SUPABASE is false
    }

    // Update conversation last_active_at
    try {
      await touchConversation(conversationId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CHAT_API] Failed to touch conversation:', errorMessage);
      
      if (REQUIRE_SUPABASE) {
        const latencyMs = Date.now() - startTime;
        logRequest(requestId, ip, 500, latencyMs, trimmedMessage.length, `Supabase persistence failed: ${errorMessage}`);
        return new Response(
          JSON.stringify({
            error: 'Supabase persistence failed',
            requestId,
            details: errorMessage
          } as ErrorResponse),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      // Continue without failing the request if REQUIRE_SUPABASE is false
    }

    // Compute and upsert lead signals
    let currentLead: { intent_score: number; handoff_requested: boolean } | null = null;
    try {
      const leadSignals = computeLeadSignals(trimmedMessage);
      await upsertLead(conversationId, leadSignals);
      
      // Fetch current lead state for enrichment check
      currentLead = await getLead(conversationId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CHAT_API] Failed to upsert lead:', errorMessage);
      
      if (REQUIRE_SUPABASE) {
        const latencyMs = Date.now() - startTime;
        logRequest(requestId, ip, 500, latencyMs, trimmedMessage.length, `Supabase persistence failed: ${errorMessage}`);
        return new Response(
          JSON.stringify({
            error: 'Supabase persistence failed',
            requestId,
            details: errorMessage
          } as ErrorResponse),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      // Continue without failing the request if REQUIRE_SUPABASE is false
    }

    // Lead enrichment (only for hot leads, after main reply is sent)
    let enrichmentTriggered = false;
    let enrichmentParseOk = false;
    
    if (currentLead) {
      const hotScoreThreshold = Number(process.env.HOT_SCORE_THRESHOLD ?? '70');
      const isHot = currentLead.handoff_requested || currentLead.intent_score >= hotScoreThreshold;
      
      if (isHot) {
        enrichmentTriggered = true;
        
        try {
          // Fetch last 12 messages with timestamps
          const enrichmentMessages = await getRecentMessages(conversationId, 12, true);
          
          // Format transcript for OpenAI
          const transcriptText = enrichmentMessages
            .map(msg => {
              const timeStr = msg.created_at 
                ? new Date(msg.created_at).toLocaleTimeString('en-US', { hour12: false })
                : '[time]';
              return `[${timeStr}] ${msg.role}: ${msg.content}`;
            })
            .join('\n');
          
          // Enrichment prompt
          const enrichmentSystemPrompt = `You are a sales qualification assistant. Extract structured information from the conversation transcript below.

Return ONLY valid JSON. No markdown, no code blocks, no explanations. Just the JSON object.

Rules:
- Use ONLY information explicitly stated in the conversation. Do NOT guess or infer.
- If a field is unknown or not mentioned, return null for that field.
- summary must be factual (1-2 sentences).
- suggested_reply should be short, friendly, and move toward scheduling a demo.

JSON schema:
{
  "company_name": string|null,
  "website": string|null,
  "industry": string|null,
  "role": string|null,
  "use_case": string|null,
  "primary_goal": string|null,
  "scale": string|null,
  "timeline": string|null,
  "next_step": string|null,
  "suggested_reply": string|null,
  "summary": string
}`;

          const enrichmentUserPrompt = `Extract qualification data from this conversation:\n\n${transcriptText}`;

          // Call OpenAI Responses API for enrichment
          const enrichmentApiKey = import.meta.env.OPENAI_API_KEY;
          if (enrichmentApiKey) {
            const enrichmentRequestBody = {
              model: OPENAI_MODEL,
              input: [
                {
                  role: 'system',
                  content: [{ type: 'input_text', text: enrichmentSystemPrompt }]
                },
                {
                  role: 'user',
                  content: [{ type: 'input_text', text: enrichmentUserPrompt }]
                }
              ]
            };

            const enrichmentResponse = await fetch(OPENAI_API_URL, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${enrichmentApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(enrichmentRequestBody)
            });

            if (enrichmentResponse.ok) {
              const enrichmentData = await enrichmentResponse.json();
              const enrichmentText = extractTextFromResponsesAPI(enrichmentData);
              
              // Parse JSON
              try {
                const enrichmentJson = JSON.parse(enrichmentText);
                enrichmentParseOk = true;
                
                // Upsert enriched data
                await upsertLead(conversationId, {
                  company_name: enrichmentJson.company_name || null,
                  website: enrichmentJson.website || null,
                  industry: enrichmentJson.industry || null,
                  role: enrichmentJson.role || null,
                  use_case: enrichmentJson.use_case || null,
                  primary_goal: enrichmentJson.primary_goal || null,
                  scale: enrichmentJson.scale || null,
                  timeline: enrichmentJson.timeline || null,
                  next_step: enrichmentJson.next_step || null,
                  suggested_reply: enrichmentJson.suggested_reply || null,
                  last_summary: enrichmentJson.summary || null
                });
              } catch (parseError) {
                // JSON parse failed - skip enrichment but don't break chat
                console.error('[CHAT_API] Failed to parse enrichment JSON:', parseError);
                enrichmentParseOk = false;
              }
            } else {
              // OpenAI enrichment failed - skip but don't break chat
              console.error('[CHAT_API] OpenAI enrichment request failed:', enrichmentResponse.status);
            }
          }
        } catch (enrichmentError) {
          // Enrichment failed - skip but don't break chat
          console.error('[CHAT_API] Lead enrichment failed:', enrichmentError);
        }
      }
    }

    // Debug logging for enrichment
    if (DEBUG_ENABLED) {
      console.log(JSON.stringify({
        enrichmentTriggered,
        enrichmentParseOk
      }, null, 2));
    }

    // Return successful response
    const latencyMs = Date.now() - startTime;
    logRequest(requestId, ip, 200, latencyMs, trimmedMessage.length);
    
    const response: ChatResponse = { reply, requestId, conversationId };
    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(RATE_LIMIT_REQUESTS),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString()
        }
      }
    );

  } catch (error) {
    // Handle unexpected errors
    const latencyMs = Date.now() - startTime;
    logRequest(requestId, ip, 500, latencyMs, 0, `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        requestId
      } as ErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

