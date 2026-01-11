// Supabase Admin Client (Server-only)
// Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS
// Never expose this key in client-side code or responses

const SUPABASE_URL = import.meta.env.SUPABASE_URL;
const SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Asserts that required environment variables are set
 * @throws Error if SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing
 */
export function assertEnv(): void {
  if (!SUPABASE_URL) {
    throw new Error('SUPABASE_URL environment variable is not set');
  }
  if (!SERVICE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  }
}

/**
 * Base URL for Supabase REST API
 */
const getBaseUrl = (): string => {
  assertEnv();
  return `${SUPABASE_URL}/rest/v1`;
};

/**
 * Default headers for Supabase REST API requests
 * Uses service role key to bypass RLS
 */
const getDefaultHeaders = (): HeadersInit => {
  assertEnv();
  return {
    'apikey': SERVICE_KEY,
    'authorization': `Bearer ${SERVICE_KEY}`,
    'content-type': 'application/json'
  };
};

/**
 * Fetches from Supabase REST API with service role key
 * @param path - API path (e.g., '/conversations')
 * @param init - Fetch options
 * @returns Parsed JSON response
 * @throws Error with status and response text on non-2xx responses
 */
export async function supabaseFetch(
  path: string,
  init?: RequestInit
): Promise<any> {
  assertEnv();
  
  const url = `${getBaseUrl()}${path}`;
  
  // Base headers with service role key (must always be present)
  const baseHeaders = getDefaultHeaders();
  
  // Merge init headers correctly
  // Convert init.headers to plain object if it's a Headers object
  let initHeadersObj: Record<string, string> = {};
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        initHeadersObj[key] = value;
      });
    } else if (typeof init.headers === 'object') {
      initHeadersObj = { ...init.headers } as Record<string, string>;
    }
  }
  
  // Merge headers: baseHeaders first, then init headers, but baseHeaders auth/apikey cannot be overwritten
  const mergedHeaders: HeadersInit = {
    ...baseHeaders,
    ...initHeadersObj,
    // Always ensure authorization and apikey from baseHeaders are preserved (cannot be overwritten)
    'apikey': baseHeaders.apikey as string,
    'authorization': baseHeaders.authorization as string
  };

  const response = await fetch(url, {
    ...init,
    headers: mergedHeaders
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    // Truncate error text to 1000 chars to avoid huge error messages
    const truncatedErrorText = errorText.length > 1000 
      ? errorText.substring(0, 1000) + '... (truncated)'
      : errorText;
    
    // Sanitize error message to remove any potential secrets
    // Remove any patterns that might look like keys or tokens
    const sanitizedErrorText = truncatedErrorText
      .replace(/Bearer\s+[\w-]+/gi, 'Bearer [REDACTED]')
      .replace(/apikey['":\s]*[\w-]+/gi, 'apikey [REDACTED]')
      .replace(/service[_-]?role[_-]?key['":\s]*[\w-]+/gi, 'service_role_key [REDACTED]')
      .replace(/eyJ[\w-]+\./g, '[JWT_REDACTED].'); // JWT tokens start with eyJ
    
    throw new Error(
      `Supabase API error: status=${response.status}, statusText=${response.statusText}, body=${sanitizedErrorText}`
    );
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    // If response is not JSON, return the text
    return text;
  }
}

/**
 * Creates a new conversation
 * @returns The created conversation ID (uuid)
 */
export async function createConversation(): Promise<string> {
  const response = await supabaseFetch('/conversations', {
    method: 'POST',
    headers: {
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({})
  });

  // Response is an array with the inserted row
  if (Array.isArray(response) && response.length > 0) {
    return response[0].id;
  }
  
  throw new Error('Failed to create conversation: unexpected response format');
}

/**
 * Updates the last_active_at timestamp for a conversation
 * @param conversationId - UUID of the conversation
 */
export async function touchConversation(conversationId: string): Promise<void> {
  await supabaseFetch(`/conversations?id=eq.${conversationId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      last_active_at: new Date().toISOString()
    })
  });
}

/**
 * Inserts a message into the messages table
 * @param conversationId - UUID of the conversation
 * @param role - Message role: 'user', 'assistant', or 'system'
 * @param content - Message content text
 * @param requestId - Optional request ID for correlation
 */
export async function insertMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  requestId?: string
): Promise<void> {
  await supabaseFetch('/messages', {
    method: 'POST',
    body: JSON.stringify({
      conversation_id: conversationId,
      role,
      content,
      request_id: requestId || null
    })
  });
}

/**
 * Gets recent messages from a conversation
 * @param conversationId - UUID of the conversation
 * @param limit - Maximum number of messages to fetch (default: 12, max: 20)
 * @param includeTimestamps - Whether to include created_at timestamps (default: false)
 * @returns Array of messages with role, content, and optionally created_at
 */
export async function getRecentMessages(
  conversationId: string,
  limit: number = 12,
  includeTimestamps: boolean = false
): Promise<Array<{ role: 'user' | 'assistant' | 'system'; content: string; created_at?: string | null }>> {
  // Cap limit at 20 to avoid fetching too many messages
  const cappedLimit = Math.min(limit, 20);
  
  // URL-encode the conversation_id to ensure proper query parameter handling
  const encodedConversationId = encodeURIComponent(conversationId);
  
  try {
    const response = await supabaseFetch(
      `/messages?conversation_id=eq.${encodedConversationId}&select=role,content,created_at&order=created_at.asc&limit=${cappedLimit}`,
      {
        method: 'GET'
        // Do NOT set Prefer headers for GET requests
      }
    );

    // Response is an array of message objects
    if (Array.isArray(response)) {
      return response.map((msg: any) => {
        const result: { role: 'user' | 'assistant' | 'system'; content: string; created_at?: string | null } = {
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content as string
        };
        if (includeTimestamps && msg.created_at) {
          result.created_at = msg.created_at;
        }
        return result;
      });
    }

    return [];
  } catch (error) {
    // Handle errors gracefully - return empty array instead of throwing
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Debug logging (only if DEBUG_OPENAI env var is set)
    const DEBUG_ENABLED = import.meta.env.DEBUG_OPENAI === 'true' || import.meta.env.DEBUG_OPENAI === true;
    if (DEBUG_ENABLED) {
      // Try to extract status and bodyText from error message
      const statusMatch = errorMessage.match(/status=(\d+)/);
      const statusTextMatch = errorMessage.match(/statusText=([^,]+)/);
      const bodyMatch = errorMessage.match(/body=(.+)$/);
      
      const status = statusMatch ? statusMatch[1] : 'unknown';
      const statusText = statusTextMatch ? statusTextMatch[1] : 'unknown';
      const bodyText = bodyMatch ? bodyMatch[1].substring(0, 500) : errorMessage.substring(0, 500);
      
      console.log(JSON.stringify({
        SUPABASE_HISTORY_NON_2XX: {
          status,
          statusText,
          bodyText
        }
      }, null, 2));
    }
    
    // Return empty array instead of throwing
    return [];
  }
}

/**
 * Upserts a lead record (insert or update on conflict)
 * @param conversationId - UUID of the conversation
 * @param patch - Fields to update/insert
 */
export async function upsertLead(
  conversationId: string,
  patch: {
    intent_score?: number;
    handoff_requested?: boolean;
    last_summary?: string;
    company_name?: string;
    website?: string;
    industry?: string;
    role?: string;
    use_case?: string;
    primary_goal?: string;
    scale?: string;
    timeline?: string;
    next_step?: string;
    suggested_reply?: string;
  }
): Promise<void> {
  await supabaseFetch('/leads?on_conflict=conversation_id', {
    method: 'POST',
    headers: {
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      ...patch
    })
  });
}

/**
 * Gets a single lead by conversation ID
 * @param conversationId - UUID of the conversation
 * @returns Lead record or null if not found
 */
export async function getLead(
  conversationId: string
): Promise<{
  conversation_id: string;
  intent_score: number;
  handoff_requested: boolean;
  updated_at: string;
  last_summary: string | null;
  company_name: string | null;
  website: string | null;
  industry: string | null;
  role: string | null;
  use_case: string | null;
  primary_goal: string | null;
  scale: string | null;
  timeline: string | null;
  next_step: string | null;
  suggested_reply: string | null;
} | null> {
  const encodedConversationId = encodeURIComponent(conversationId);
  
  try {
    const response = await supabaseFetch(
      `/leads?conversation_id=eq.${encodedConversationId}&select=conversation_id,intent_score,handoff_requested,updated_at,last_summary,company_name,website,industry,role,use_case,primary_goal,scale,timeline,next_step,suggested_reply&limit=1`,
      {
        method: 'GET'
      }
    );

    if (Array.isArray(response) && response.length > 0) {
      return response[0];
    }

    return null;
  } catch (error) {
    console.error('[SUPABASE_ADMIN] Failed to get lead:', error);
    return null;
  }
}

/**
 * Lists leads from Supabase
 * @param limit - Maximum number of leads to fetch (default: 50, max: 100)
 * @returns Array of lead records
 */
export async function listLeads(
  limit: number = 50
): Promise<Array<{
  conversation_id: string;
  intent_score: number;
  handoff_requested: boolean;
  last_summary: string | null;
  updated_at: string;
  created_at: string;
  company_name: string | null;
  website: string | null;
  industry: string | null;
  role: string | null;
  use_case: string | null;
  primary_goal: string | null;
  scale: string | null;
  timeline: string | null;
  next_step: string | null;
  suggested_reply: string | null;
}>> {
  const cappedLimit = Math.min(limit, 100);
  
  try {
    const response = await supabaseFetch(
      `/leads?select=conversation_id,intent_score,handoff_requested,last_summary,updated_at,created_at,company_name,website,industry,role,use_case,primary_goal,scale,timeline,next_step,suggested_reply&order=updated_at.desc&limit=${cappedLimit}`,
      {
        method: 'GET'
      }
    );

    if (Array.isArray(response)) {
      return response;
    }

    return [];
  } catch (error) {
    // Return empty array on error
    console.error('[SUPABASE_ADMIN] Failed to list leads:', error);
    return [];
  }
}

/**
 * Search OpenAPI endpoints by query string
 * @param query - Search query (searches in path, summary, description, and tags)
 * @param limit - Maximum number of results (default: 8)
 * @returns Array of matching endpoints
 */
export async function searchOpenApiEndpoints(
  query: string,
  limit: number = 8
): Promise<Array<{
  method: string;
  path: string;
  tags: string[];
  summary: string | null;
  description: string | null;
  deprecated: boolean;
}>> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const trimmedQuery = query.trim().toLowerCase();
  const cappedLimit = Math.min(limit, 20); // Cap at 20

  try {
    // Query 1: Search in path, summary, description using ilike
    const searchPattern = `%${trimmedQuery}%`;
    const query1 = supabaseFetch(
      `/kb_openapi_endpoints?select=method,path,tags,summary,description,deprecated&or=(path.ilike.${encodeURIComponent(searchPattern)},summary.ilike.${encodeURIComponent(searchPattern)},description.ilike.${encodeURIComponent(searchPattern)})&order=updated_at.desc&limit=${cappedLimit}`,
      { method: 'GET' }
    );

    // Query 2: Search in tags (if query looks like a tag keyword)
    // Extract potential tag keywords from query
    const tagKeywords = trimmedQuery.split(/\s+/).filter(w => w.length > 2);
    let query2: Promise<any> = Promise.resolve([]);
    
    if (tagKeywords.length > 0) {
      // Try to match tags using PostgREST array contains operator
      // PostgREST: tags=cs.{value} means tags array contains the value
      const tagQueries = tagKeywords.map(keyword => {
        // PostgREST array contains syntax: tags=cs.{value}
        const encodedKeyword = encodeURIComponent(keyword);
        return supabaseFetch(
          `/kb_openapi_endpoints?select=method,path,tags,summary,description,deprecated&tags=cs.{${encodedKeyword}}&order=updated_at.desc&limit=${cappedLimit}`,
          { method: 'GET' }
        ).catch(() => []); // Return empty array on error
      });
      query2 = Promise.all(tagQueries).then(results => {
        // Flatten and deduplicate
        const all = results.flat();
        const seen = new Set<string>();
        return all.filter((ep: any) => {
          const key = `${ep.method}:${ep.path}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      });
    }

    // Execute both queries in parallel
    const [results1, results2] = await Promise.all([query1, query2]);

    // Merge and deduplicate by method+path
    const seen = new Set<string>();
    const merged: Array<{
      method: string;
      path: string;
      tags: string[];
      summary: string | null;
      description: string | null;
      deprecated: boolean;
    }> = [];

    // Add results from query 1
    if (Array.isArray(results1)) {
      for (const ep of results1) {
        const key = `${ep.method}:${ep.path}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push({
            method: ep.method,
            path: ep.path,
            tags: Array.isArray(ep.tags) ? ep.tags : [],
            summary: ep.summary || null,
            description: ep.description || null,
            deprecated: ep.deprecated === true
          });
        }
      }
    }

    // Add results from query 2
    if (Array.isArray(results2)) {
      for (const ep of results2) {
        const key = `${ep.method}:${ep.path}`;
        if (!seen.has(key) && merged.length < cappedLimit) {
          seen.add(key);
          merged.push({
            method: ep.method,
            path: ep.path,
            tags: Array.isArray(ep.tags) ? ep.tags : [],
            summary: ep.summary || null,
            description: ep.description || null,
            deprecated: ep.deprecated === true
          });
        }
      }
    }

    // Limit final results
    return merged.slice(0, cappedLimit);
  } catch (error) {
    // Return empty array on error
    console.error('[SUPABASE_ADMIN] Failed to search OpenAPI endpoints:', error);
    return [];
  }
}

