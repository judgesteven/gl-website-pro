-- Migration: Add OpenAPI Knowledge Base tables
-- Date: 2025-01-XX
-- Description: Stores parsed OpenAPI endpoints and tags for agent knowledge base

-- Create kb_openapi_tags table
CREATE TABLE IF NOT EXISTS kb_openapi_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text UNIQUE NOT NULL,
  description text NULL,
  source text NOT NULL DEFAULT 'docs/gamelayer.yaml'
);

-- Create kb_openapi_endpoints table
CREATE TABLE IF NOT EXISTS kb_openapi_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  method text NOT NULL,
  path text NOT NULL,
  operation_id text NULL,
  tags text[] DEFAULT '{}',
  summary text NULL,
  description text NULL,
  deprecated boolean DEFAULT false,
  security text NULL,
  source text NOT NULL DEFAULT 'docs/gamelayer.yaml',
  UNIQUE(method, path)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_openapi_endpoints_tags ON kb_openapi_endpoints USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_openapi_endpoints_path ON kb_openapi_endpoints USING btree(path);
CREATE INDEX IF NOT EXISTS idx_openapi_endpoints_summary ON kb_openapi_endpoints USING gin(to_tsvector('english', coalesce(summary,'') || ' ' || coalesce(description,'')));

-- Add updated_at trigger for kb_openapi_endpoints
-- Reuse existing update_updated_at_column function if it exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_kb_openapi_endpoints_updated_at'
  ) THEN
    CREATE TRIGGER update_kb_openapi_endpoints_updated_at
      BEFORE UPDATE ON kb_openapi_endpoints
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;








