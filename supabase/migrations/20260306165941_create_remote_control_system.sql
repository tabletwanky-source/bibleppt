-- Remote Control System for BibleSlide Presentations
--
-- 1. New Tables
--    - sessions: Stores active presentation sessions with unique codes
--      * id (uuid, primary key) - Unique session identifier
--      * session_code (text, unique) - 6-character alphanumeric code
--      * user_id (uuid, foreign key) - Reference to auth.users
--      * created_at (timestamptz) - Session creation timestamp
--      * is_active (boolean) - Whether session is currently active
--      * expires_at (timestamptz) - Auto-expiration timestamp (24 hours)
--
--    - remote_commands: Stores slide control commands from remote devices
--      * id (uuid, primary key) - Unique command identifier
--      * session_code (text) - Reference to active session
--      * command (text) - Command type: 'next' or 'previous'
--      * created_at (timestamptz) - Command timestamp
--      * processed (boolean) - Whether command has been processed
--
-- 2. Security
--    - Enable RLS on both tables
--    - Sessions: Only authenticated users can create/manage their own sessions
--    - Sessions: Anyone can read active sessions (for remote controllers)
--    - Commands: Anyone can insert commands for active sessions
--    - Commands: Only session owners can read their commands
--
-- 3. Indexes
--    - session_code for fast lookups
--    - created_at for timestamp queries
--    - is_active for filtering active sessions

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

-- Create remote_commands table
CREATE TABLE IF NOT EXISTS remote_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code text NOT NULL,
  command text NOT NULL CHECK (command IN ('next', 'previous')),
  created_at timestamptz DEFAULT now(),
  processed boolean DEFAULT false
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_commands_session ON remote_commands(session_code);
CREATE INDEX IF NOT EXISTS idx_commands_created ON remote_commands(created_at DESC);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE remote_commands ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Authenticated users can create their own sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read active sessions by code"
  ON sessions FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Remote commands policies
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
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Session owners can update their commands"
  ON remote_commands FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.session_code = remote_commands.session_code 
      AND sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.session_code = remote_commands.session_code 
      AND sessions.user_id = auth.uid()
    )
  );

-- Function to auto-deactivate expired sessions
CREATE OR REPLACE FUNCTION deactivate_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE sessions
  SET is_active = false
  WHERE is_active = true AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old commands (keep last 100 per session)
CREATE OR REPLACE FUNCTION cleanup_old_commands()
RETURNS void AS $$
BEGIN
  DELETE FROM remote_commands
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY session_code ORDER BY created_at DESC) as rn
      FROM remote_commands
    ) t
    WHERE rn > 100
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;