-- Security and Performance Optimization Migration
--
-- This migration addresses the following issues:
-- 1. Adds missing indexes on foreign key columns
-- 2. Optimizes RLS policies to use (select auth.uid())
-- 3. Adds missing RLS policies for remote control tables
-- 4. Fixes function search path mutability
-- 5. Removes unused indexes
--
-- Foreign Key Indexes
-- ====================

-- Add index for sessions.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Add index for templates.user_id foreign key (if templates table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'templates') THEN
    CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
  END IF;
END $$;

-- Add index for user_preferences.user_id foreign key (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
    CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
  END IF;
END $$;

-- RLS Policy Optimization
-- =======================

-- Drop and recreate sessions policies with optimized auth check
DROP POLICY IF EXISTS "Authenticated users can create their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON sessions;
DROP POLICY IF EXISTS "Anyone can read active sessions by code" ON sessions;

-- Optimized sessions policies
CREATE POLICY "Authenticated users can create their own sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can view their own sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own sessions"
  ON sessions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON sessions FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Anyone can read active sessions by code"
  ON sessions FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Drop and recreate remote_commands policies with optimized auth check
DROP POLICY IF EXISTS "Anyone can insert commands for active sessions" ON remote_commands;
DROP POLICY IF EXISTS "Session owners can read their commands" ON remote_commands;
DROP POLICY IF EXISTS "Session owners can update their commands" ON remote_commands;

-- Optimized remote_commands policies
CREATE POLICY "Anyone can insert commands for active sessions"
  ON remote_commands FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.session_code = remote_commands.session_code 
      AND sessions.is_active = true
    )
  );

CREATE POLICY "Session owners can read their commands"
  ON remote_commands FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.session_code = remote_commands.session_code 
      AND sessions.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Session owners can update their commands"
  ON remote_commands FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.session_code = remote_commands.session_code 
      AND sessions.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.session_code = remote_commands.session_code 
      AND sessions.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Session owners can delete their commands"
  ON remote_commands FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.session_code = remote_commands.session_code 
      AND sessions.user_id = (select auth.uid())
    )
  );

-- Optimize templates RLS policies if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'templates') THEN
    -- Drop existing policy
    DROP POLICY IF EXISTS "Users can manage their own templates" ON templates;
    
    -- Create optimized policies
    CREATE POLICY "Users can view their own templates"
      ON templates FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id);
    
    CREATE POLICY "Users can insert their own templates"
      ON templates FOR INSERT
      TO authenticated
      WITH CHECK ((select auth.uid()) = user_id);
    
    CREATE POLICY "Users can update their own templates"
      ON templates FOR UPDATE
      TO authenticated
      USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id);
    
    CREATE POLICY "Users can delete their own templates"
      ON templates FOR DELETE
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- Optimize user_preferences RLS policies if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
    -- Drop existing policy
    DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;
    
    -- Create optimized policies
    CREATE POLICY "Users can view their own preferences"
      ON user_preferences FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id);
    
    CREATE POLICY "Users can insert their own preferences"
      ON user_preferences FOR INSERT
      TO authenticated
      WITH CHECK ((select auth.uid()) = user_id);
    
    CREATE POLICY "Users can update their own preferences"
      ON user_preferences FOR UPDATE
      TO authenticated
      USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id);
    
    CREATE POLICY "Users can delete their own preferences"
      ON user_preferences FOR DELETE
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- Fix function search path mutability
-- =====================================

-- Drop and recreate function with stable search path
DROP FUNCTION IF EXISTS fn_update_session_current_slide(uuid, integer);

CREATE OR REPLACE FUNCTION fn_update_session_current_slide(
  p_session_id uuid,
  p_slide_index integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE sessions
  SET updated_at = now()
  WHERE id = p_session_id
  AND user_id = auth.uid();
END;
$$;

-- Remove unused index
-- ===================

-- Drop the unused index on remote_commands.session_code
-- We keep idx_commands_session which serves the same purpose
DROP INDEX IF EXISTS idx_remote_commands_session_code;

-- Performance optimization: Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_remote_commands_session_unprocessed 
  ON remote_commands(session_code, created_at DESC) 
  WHERE processed = false;

-- Add index for session expiration cleanup queries
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at 
  ON sessions(expires_at) 
  WHERE is_active = true;