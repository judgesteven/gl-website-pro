import type { APIRoute } from 'astro';
import { getRecentMessages } from '../../lib/supabaseAdmin';

const REQUIRE_SUPABASE = process.env.REQUIRE_SUPABASE === 'true';

export const GET: APIRoute = async ({ url, request }) => {
  const conversationId = url.searchParams.get('conversationId');

  if (!conversationId) {
    return new Response(
      JSON.stringify({
        error: 'conversationId required'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  try {
    // Fetch last 20 messages from Supabase with timestamps
    const messages = await getRecentMessages(conversationId, 20, true);

    return new Response(
      JSON.stringify({
        conversationId,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at || null
        }))
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (REQUIRE_SUPABASE) {
      return new Response(
        JSON.stringify({
          error: 'Failed to load conversation from Supabase',
          details: errorMessage
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // If REQUIRE_SUPABASE is false, return empty messages array
    return new Response(
      JSON.stringify({
        conversationId,
        messages: []
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};

