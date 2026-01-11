import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const hasOpenAIKey = !!import.meta.env.OPENAI_API_KEY;
  const hasSupabaseUrl = !!import.meta.env.SUPABASE_URL;
  const hasSupabaseAnonKey = !!import.meta.env.SUPABASE_ANON_KEY;
  const hasSupabaseServiceRoleKey = !!import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  return new Response(
    JSON.stringify({
      ok: true,
      hasOpenAIKey,
      hasSupabaseUrl,
      hasSupabaseAnonKey,
      hasSupabaseServiceRoleKey
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
};

