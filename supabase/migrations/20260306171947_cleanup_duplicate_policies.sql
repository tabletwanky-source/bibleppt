-- Clean up duplicate RLS policies
--
-- This migration removes older/duplicate policies to maintain a clean policy set

-- Clean up sessions table - keep only the new optimized policies
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON sessions;
DROP POLICY IF EXISTS "Users can read own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;
DROP POLICY IF EXISTS "Public can read active sessions" ON sessions;

-- Clean up remote_commands table - keep only the new optimized policies
DROP POLICY IF EXISTS "Session owners can read commands" ON remote_commands;
DROP POLICY IF EXISTS "Session owners can update commands" ON remote_commands;
DROP POLICY IF EXISTS "Session owners can delete commands" ON remote_commands;
DROP POLICY IF EXISTS "Public can insert commands for active sessions" ON remote_commands;

-- Verify all tables have RLS enabled
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE remote_commands ENABLE ROW LEVEL SECURITY;

-- Note: The migration keeps the following policies (new optimized ones):
-- sessions:
--   - "Authenticated users can create their own sessions"
--   - "Users can view their own sessions"
--   - "Users can update their own sessions"
--   - "Users can delete their own sessions"
--   - "Anyone can read active sessions by code"
--
-- remote_commands:
--   - "Anyone can insert commands for active sessions"
--   - "Session owners can read their commands"
--   - "Session owners can update their commands"
--   - "Session owners can delete their commands"