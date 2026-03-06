/*
  # Remote Control Device Count Automation

  This migration adds automated tracking of connected device counts for
  supporting up to 1000 simultaneous remote devices per session.

  ## Changes

  ### 1. Database Functions
  - `update_session_device_count()` - Trigger function that recalculates and updates
    connected_devices_count on the sessions table whenever devices register or update.
    A device is considered "active" if its last_seen is within the last 2 minutes.

  ### 2. Triggers
  - `trg_update_device_count_on_insert` - fires on INSERT to remote_devices
  - `trg_update_device_count_on_update` - fires on UPDATE to remote_devices
  - `trg_update_device_count_on_delete` - fires on DELETE to remote_devices

  ### 3. Helper Functions
  - `cleanup_stale_remote_devices()` - removes stale devices and updates counts
  - `refresh_all_session_device_counts()` - recalculates all session device counts

  ### 4. Performance Indexes
  - Index on session_code for fast count queries

  ### 5. Realtime
  - Ensures sessions, remote_commands, and remote_devices are in the realtime publication
*/

-- =====================================================
-- 1. ENSURE remote_devices HAS PROPER STRUCTURE
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'remote_devices' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE remote_devices ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- =====================================================
-- 2. PERFORMANCE INDEXES FOR DEVICE COUNT
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_remote_devices_session_code_last_seen
  ON public.remote_devices(session_code, last_seen);

CREATE INDEX IF NOT EXISTS idx_remote_devices_session_code_active
  ON public.remote_devices(session_code, is_active);

-- =====================================================
-- 3. TRIGGER FUNCTION: UPDATE DEVICE COUNT
-- =====================================================

CREATE OR REPLACE FUNCTION update_session_device_count()
RETURNS TRIGGER AS $$
DECLARE
  v_session_code text;
  v_active_count integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_session_code := OLD.session_code;
  ELSE
    v_session_code := NEW.session_code;
  END IF;

  SELECT COUNT(*)
  INTO v_active_count
  FROM remote_devices
  WHERE session_code = v_session_code
    AND last_seen > (now() - interval '2 minutes');

  UPDATE sessions
  SET connected_devices_count = v_active_count
  WHERE session_code = v_session_code;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. ATTACH TRIGGERS TO remote_devices
-- =====================================================

DROP TRIGGER IF EXISTS trg_update_device_count_on_insert ON public.remote_devices;
DROP TRIGGER IF EXISTS trg_update_device_count_on_update ON public.remote_devices;
DROP TRIGGER IF EXISTS trg_update_device_count_on_delete ON public.remote_devices;

CREATE TRIGGER trg_update_device_count_on_insert
  AFTER INSERT ON public.remote_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_session_device_count();

CREATE TRIGGER trg_update_device_count_on_update
  AFTER UPDATE ON public.remote_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_session_device_count();

CREATE TRIGGER trg_update_device_count_on_delete
  AFTER DELETE ON public.remote_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_session_device_count();

-- =====================================================
-- 5. CLEANUP FUNCTION FOR STALE DEVICES
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_stale_remote_devices()
RETURNS void AS $$
DECLARE
  v_session_code text;
BEGIN
  FOR v_session_code IN
    SELECT DISTINCT session_code
    FROM remote_devices
    WHERE last_seen < (now() - interval '2 minutes')
  LOOP
    DELETE FROM remote_devices
    WHERE session_code = v_session_code
      AND last_seen < (now() - interval '2 minutes');

    UPDATE sessions
    SET connected_devices_count = (
      SELECT COUNT(*)
      FROM remote_devices
      WHERE session_code = v_session_code
        AND last_seen > (now() - interval '2 minutes')
    )
    WHERE session_code = v_session_code;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. REFRESH ALL SESSION DEVICE COUNTS
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_all_session_device_counts()
RETURNS void AS $$
BEGIN
  UPDATE sessions s
  SET connected_devices_count = (
    SELECT COUNT(*)
    FROM remote_devices rd
    WHERE rd.session_code = s.session_code
      AND rd.last_seen > (now() - interval '2 minutes')
  )
  WHERE s.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. ENABLE REALTIME ON KEY TABLES
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'remote_commands'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE remote_commands;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'remote_devices'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE remote_devices;
  END IF;
END $$;

-- =====================================================
-- 8. ENSURE RLS POLICIES EXIST FOR remote_devices
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'remote_devices'
      AND policyname = 'Anyone can register device connection'
  ) THEN
    CREATE POLICY "Anyone can register device connection"
      ON public.remote_devices
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM sessions
          WHERE sessions.session_code = remote_devices.session_code
            AND sessions.is_active = true
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'remote_devices'
      AND policyname = 'Anyone can view devices for active sessions'
  ) THEN
    CREATE POLICY "Anyone can view devices for active sessions"
      ON public.remote_devices
      FOR SELECT
      TO anon, authenticated
      USING (
        EXISTS (
          SELECT 1 FROM sessions
          WHERE sessions.session_code = remote_devices.session_code
            AND sessions.is_active = true
        )
      );
  END IF;
END $$;

-- =====================================================
-- 9. ENSURE RLS POLICY FOR anon TO READ SESSIONS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sessions'
      AND policyname = 'Anyone can read active sessions by code'
  ) THEN
    CREATE POLICY "Anyone can read active sessions by code"
      ON public.sessions
      FOR SELECT
      TO anon, authenticated
      USING (is_active = true);
  END IF;
END $$;
