/// <reference path="../.astro/types.d.ts" />

/// <reference types="astro/client" />

declare namespace App {
  interface ImportMetaEnv {
    readonly OPENAI_API_KEY?: string;
    readonly SUPABASE_URL?: string;
    readonly SUPABASE_ANON_KEY?: string;
    readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  }
}