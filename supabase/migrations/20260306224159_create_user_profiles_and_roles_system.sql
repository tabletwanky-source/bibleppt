/*
  # User Profiles and Role System for BibleSlide

  This migration creates a complete user profile system with role-based access control.

  ## New Tables

  ### 1. `profiles`
  Stores extended user profile information linked to auth.users.
  - `id` (uuid, PK) - References auth.users.id
  - `full_name` (text) - User's full display name
  - `bio` (text) - Short biography or description
  - `church_name` (text) - Name of the user's church
  - `country` (text) - User's country
  - `avatar_url` (text) - URL to profile photo in Supabase Storage
  - `role` (text) - Either 'user' or 'admin', defaults to 'user'
  - `preferred_language` (text) - Language preference: 'en', 'fr', 'es', 'ht'
  - `last_login` (timestamptz) - Last login timestamp
  - `is_active` (boolean) - Whether account is active (admins can deactivate)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Auto-Create Profile Trigger
  When a new user registers, automatically insert a row in profiles with their email as full_name.

  ## Security
  - RLS enabled on profiles table
  - Users can only read and update their own profile
  - Admins can read and update all profiles
  - Users cannot change their own role (only admins can)

  ## Notes
  - The role check for admin uses a security definer function to avoid recursion in RLS policies
  - Avatar URLs point to Supabase Storage bucket 'avatars'
*/

-- =====================================================
-- 1. CREATE PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  bio text DEFAULT '',
  church_name text DEFAULT '',
  country text DEFAULT '',
  avatar_url text DEFAULT '',
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  preferred_language text DEFAULT 'en' CHECK (preferred_language IN ('en', 'fr', 'es', 'ht')),
  last_login timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 2. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- =====================================================
-- 3. ENABLE RLS
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. ADMIN CHECK FUNCTION (security definer to avoid policy recursion)
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile (but not their role)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can update all profiles (including roles)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allow insert during signup trigger (uses service role / trigger context)
CREATE POLICY "Service can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 6. AUTO-CREATE PROFILE TRIGGER
-- =====================================================

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 7. UPDATE updated_at TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 8. BACKFILL PROFILES FOR EXISTING USERS
-- =====================================================

INSERT INTO public.profiles (id, full_name)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 9. ENABLE REALTIME ON PROFILES
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;
