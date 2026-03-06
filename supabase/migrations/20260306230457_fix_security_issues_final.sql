/*
  # Fix All Security Issues

  ## Changes Made

  ### 1. RLS Policy Performance (auth function re-evaluation)
  Replace `auth.uid()` with `(select auth.uid())` in all policies on public.profiles
  to prevent per-row re-evaluation of the auth function.

  ### 2. Multiple Permissive Policies — profiles
  Merge separate user/admin SELECT policies into one combined policy.
  Merge separate user/admin UPDATE policies into one combined policy.

  ### 3. Multiple Permissive Policies — sessions
  Remove the redundant "Users can view sessions" policy that overlaps with
  "Anyone can read active sessions by code".

  ### 4. Function Search Path Mutable
  Set `search_path = ''` on all affected functions and qualify all object
  references with their schema to prevent search_path injection attacks.

  ### 5. RLS Policy Always True — remote_devices UPDATE
  Fix the unrestricted UPDATE policy so devices can only update their own row.

  ### 6. Unused Indexes
  Drop all indexes flagged as unused to reduce write overhead and storage.

  ### Notes
  - Leaked password protection must be enabled in the Supabase Auth dashboard
    (Authentication > Settings > Enable HaveIBeenPwned) — cannot be done via SQL.
*/

-- =====================================================
-- 1. DROP AND RECREATE PROFILES RLS POLICIES
--    (fix per-row auth re-evaluation + merge permissive duplicates)
-- =====================================================

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service can insert profiles" ON public.profiles;

-- Single SELECT policy: own profile OR admin
CREATE POLICY "Users and admins can read profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = id
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = (select auth.uid())
      AND p2.role = 'admin'
      AND p2.is_active = true
    )
  );

-- Single UPDATE policy: own profile (no role change) OR admin (any change)
CREATE POLICY "Users and admins can update profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = id
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = (select auth.uid())
      AND p2.role = 'admin'
      AND p2.is_active = true
    )
  )
  WITH CHECK (
    (
      (select auth.uid()) = id
      AND role = (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = (select auth.uid())
      AND p2.role = 'admin'
      AND p2.is_active = true
    )
  );

-- INSERT policy for new user signup
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- =====================================================
-- 2. FIX MULTIPLE PERMISSIVE POLICIES ON sessions
-- =====================================================

DROP POLICY IF EXISTS "Users can view sessions" ON public.sessions;

-- =====================================================
-- 3. FIX FUNCTION SEARCH PATHS (mutable search_path)
-- =====================================================

-- is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid())
    AND role = 'admin'
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '';

-- handle_new_user()
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- update_updated_at_column()
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- update_session_device_count() — fix if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_session_device_count'
  ) THEN
    EXECUTE $func$
      CREATE OR REPLACE FUNCTION public.update_session_device_count()
      RETURNS TRIGGER AS $inner$
      DECLARE
        v_session_id uuid;
        v_count int;
      BEGIN
        IF TG_OP = 'DELETE' THEN
          v_session_id := OLD.session_id;
        ELSE
          v_session_id := NEW.session_id;
        END IF;

        SELECT COUNT(*) INTO v_count
        FROM public.remote_devices
        WHERE session_id = v_session_id AND is_active = true;

        UPDATE public.sessions
        SET connected_devices_count = v_count
        WHERE id = v_session_id;

        RETURN COALESCE(NEW, OLD);
      END;
      $inner$ LANGUAGE plpgsql SECURITY DEFINER
      SET search_path = '';
    $func$;
  END IF;
END $$;

-- cleanup_stale_remote_devices() — fix if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'cleanup_stale_remote_devices'
  ) THEN
    EXECUTE $func$
      CREATE OR REPLACE FUNCTION public.cleanup_stale_remote_devices()
      RETURNS void AS $inner$
      BEGIN
        UPDATE public.remote_devices
        SET is_active = false
        WHERE is_active = true
          AND last_seen < now() - interval '30 seconds';

        UPDATE public.sessions s
        SET connected_devices_count = (
          SELECT COUNT(*) FROM public.remote_devices rd
          WHERE rd.session_id = s.id AND rd.is_active = true
        )
        WHERE s.is_active = true;
      END;
      $inner$ LANGUAGE plpgsql SECURITY DEFINER
      SET search_path = '';
    $func$;
  END IF;
END $$;

-- refresh_all_session_device_counts() — fix if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'refresh_all_session_device_counts'
  ) THEN
    EXECUTE $func$
      CREATE OR REPLACE FUNCTION public.refresh_all_session_device_counts()
      RETURNS void AS $inner$
      BEGIN
        UPDATE public.sessions s
        SET connected_devices_count = (
          SELECT COUNT(*) FROM public.remote_devices rd
          WHERE rd.session_id = s.id AND rd.is_active = true
        );
      END;
      $inner$ LANGUAGE plpgsql SECURITY DEFINER
      SET search_path = '';
    $func$;
  END IF;
END $$;

-- =====================================================
-- 4. FIX remote_devices ALWAYS-TRUE UPDATE POLICY
-- =====================================================

DROP POLICY IF EXISTS "Devices can update own heartbeat" ON public.remote_devices;

CREATE POLICY "Devices can update own heartbeat"
  ON public.remote_devices
  FOR UPDATE
  TO anon, authenticated
  USING (device_id = current_setting('request.headers', true)::json->>'x-device-id'
         OR id::text = current_setting('request.headers', true)::json->>'x-device-id')
  WITH CHECK (true);

-- =====================================================
-- 5. DROP UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS public.idx_remote_devices_session_code_last_seen;
DROP INDEX IF EXISTS public.idx_remote_devices_session_code_active;
DROP INDEX IF EXISTS public.idx_profiles_role;
DROP INDEX IF EXISTS public.idx_profiles_is_active;
DROP INDEX IF EXISTS public.idx_media_files_user_id;
DROP INDEX IF EXISTS public.idx_presentation_sessions_presentation_id;
DROP INDEX IF EXISTS public.idx_presentation_sessions_user_id;
DROP INDEX IF EXISTS public.idx_presentations_theme_id;
DROP INDEX IF EXISTS public.idx_presentations_user_id;
DROP INDEX IF EXISTS public.idx_sessions_user_id;
DROP INDEX IF EXISTS public.idx_templates_user_id;
DROP INDEX IF EXISTS public.idx_themes_user_id;
DROP INDEX IF EXISTS public.idx_user_preferences_user_id;
DROP INDEX IF EXISTS public.idx_viewer_connections_session_id;
DROP INDEX IF EXISTS public.idx_sessions_code_active;
DROP INDEX IF EXISTS public.idx_remote_devices_session_device;
DROP INDEX IF EXISTS public.idx_sessions_expires_at;
