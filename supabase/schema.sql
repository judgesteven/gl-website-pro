-- Supabase SQL Schema for GameLayer AI Sales Agent
-- This schema uses RLS with service role key (server-side only access)

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

-- Ensure pgcrypto extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- A) conversations table
-- Tracks conversation sessions with the AI sales agent
CREATE TABLE IF NOT EXISTS conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    last_active_at timestamptz NOT NULL DEFAULT now()
);

-- B) messages table
-- Stores individual messages within conversations
CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content text NOT NULL,
    request_id uuid NULL
);

-- C) leads table
-- Captures lead qualification data from conversations
CREATE TABLE IF NOT EXISTS leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL UNIQUE REFERENCES conversations(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    company_name text NULL,
    website text NULL,
    industry text NULL,
    role text NULL,
    use_case text NULL,
    primary_goal text NULL,
    scale text NULL,
    timeline text NULL,
    intent_score int NOT NULL DEFAULT 0,
    last_summary text NULL,
    handoff_requested boolean NOT NULL DEFAULT false,
    next_step text NULL,
    suggested_reply text NULL
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- Index for efficient message retrieval by conversation and time
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
    ON messages(conversation_id, created_at);

-- Index for efficient conversation queries by last activity
CREATE INDEX IF NOT EXISTS idx_conversations_last_active 
    ON conversations(last_active_at);

-- ============================================================================
-- 4. UPDATED_AT TRIGGER
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update leads.updated_at on every UPDATE
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- RLS Configuration Note:
-- Row Level Security is enabled on all tables, but no permissive policies
-- are created for anon or authenticated roles. The application server uses
-- SUPABASE_SERVICE_ROLE_KEY (secret service role key) which bypasses RLS
-- entirely, providing full access to all tables. This ensures that:
-- 1. No public access is possible through anon/authenticated keys
-- 2. Only server-side code with the service role key can access data
-- 3. All database operations are controlled server-side

-- ============================================================================
-- HOW TO APPLY THIS SCHEMA
-- ============================================================================
--
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Paste this entire file into the SQL Editor
-- 3. Click "Run" to execute the schema
-- 4. Verify tables exist:
--    - SELECT * FROM conversations LIMIT 1;
--    - SELECT * FROM messages LIMIT 1;
--    - SELECT * FROM leads LIMIT 1;
-- 5. Confirm RLS is enabled:
--    - SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('conversations', 'messages', 'leads');
--    -- All should show rowsecurity = true
--
-- ============================================================================

