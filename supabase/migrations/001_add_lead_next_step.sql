-- Migration: Add next_step and suggested_reply columns to leads table
-- Date: 2024-01-01
-- Description: Adds enrichment fields for hot lead qualification data

-- Add next_step column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'next_step'
    ) THEN
        ALTER TABLE leads ADD COLUMN next_step text NULL;
    END IF;
END $$;

-- Add suggested_reply column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'suggested_reply'
    ) THEN
        ALTER TABLE leads ADD COLUMN suggested_reply text NULL;
    END IF;
END $$;

-- Verify columns were added
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'leads' 
-- AND column_name IN ('next_step', 'suggested_reply');








