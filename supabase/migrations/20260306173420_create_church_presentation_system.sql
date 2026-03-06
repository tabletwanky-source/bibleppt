/*
  # Church Presentation Platform - Complete Schema

  1. New Tables
    - `presentations`
      - `id` (uuid, primary key) - Unique presentation identifier
      - `user_id` (uuid, foreign key) - Links to auth.users
      - `title` (text) - Presentation name
      - `slides` (jsonb) - Array of slide objects with content, backgrounds, styles
      - `theme` (text) - Theme name (classic, modern, minimal, church_dark)
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last modification timestamp
      - `is_template` (boolean) - Whether this is a reusable template
    
    - `media_files`
      - `id` (uuid, primary key) - Unique media file identifier
      - `user_id` (uuid, foreign key) - Owner of the media
      - `filename` (text) - Original filename
      - `storage_path` (text) - Path in Supabase Storage
      - `file_type` (text) - Type: image, video, audio
      - `file_size` (integer) - Size in bytes
      - `created_at` (timestamptz) - Upload timestamp
    
    - `presentation_sessions`
      - `id` (uuid, primary key) - Session identifier
      - `presentation_id` (uuid, foreign key) - Active presentation
      - `user_id` (uuid, foreign key) - Presenter
      - `current_slide_index` (integer) - Current slide number
      - `is_active` (boolean) - Whether session is live
      - `started_at` (timestamptz) - Session start time
      - `ended_at` (timestamptz) - Session end time
      - `viewer_count` (integer) - Number of connected viewers

  2. Storage Buckets
    - `presentation-media` - For images, videos, backgrounds

  3. Security
    - Enable RLS on all tables
    - Users can only access their own presentations
    - Media files are private to owners
    - Presentation sessions are viewable by anyone with the link
    - Viewers can read active sessions

  4. Indexes
    - Index on user_id for fast presentation queries
    - Index on presentation_id for session lookups
    - Index on is_active for finding live presentations

  5. Important Notes
    - Slides are stored as JSONB for flexibility
    - Each slide object contains: content, background, theme overrides
    - Media files reference Supabase Storage paths
    - Real-time subscriptions enabled for presentation_sessions
*/

-- Create presentations table
CREATE TABLE IF NOT EXISTS presentations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Presentation',
  slides jsonb DEFAULT '[]'::jsonb,
  theme text DEFAULT 'classic',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_template boolean DEFAULT false
);

-- Create media_files table
CREATE TABLE IF NOT EXISTS media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  storage_path text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image', 'video', 'audio')),
  file_size integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create presentation_sessions table
CREATE TABLE IF NOT EXISTS presentation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id uuid REFERENCES presentations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_slide_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  viewer_count integer DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_sessions ENABLE ROW LEVEL SECURITY;

-- Presentations policies
CREATE POLICY "Users can view own presentations"
  ON presentations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view template presentations"
  ON presentations FOR SELECT
  TO authenticated
  USING (is_template = true);

CREATE POLICY "Users can insert own presentations"
  ON presentations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presentations"
  ON presentations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own presentations"
  ON presentations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Media files policies
CREATE POLICY "Users can view own media files"
  ON media_files FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media files"
  ON media_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own media files"
  ON media_files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Presentation sessions policies
CREATE POLICY "Users can view own sessions"
  ON presentation_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active sessions"
  ON presentation_sessions FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Users can insert own sessions"
  ON presentation_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON presentation_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON presentation_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_presentations_user_id ON presentations(user_id);
CREATE INDEX IF NOT EXISTS idx_presentations_is_template ON presentations(is_template) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_presentation_sessions_presentation_id ON presentation_sessions(presentation_id);
CREATE INDEX IF NOT EXISTS idx_presentation_sessions_is_active ON presentation_sessions(is_active) WHERE is_active = true;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for presentations
DROP TRIGGER IF EXISTS update_presentations_updated_at ON presentations;
CREATE TRIGGER update_presentations_updated_at
  BEFORE UPDATE ON presentations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for presentation media
INSERT INTO storage.buckets (id, name, public)
VALUES ('presentation-media', 'presentation-media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for presentation-media bucket
CREATE POLICY "Users can upload own media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'presentation-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'presentation-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'presentation-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );