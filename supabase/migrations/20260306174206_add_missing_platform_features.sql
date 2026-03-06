/*
  # Add Missing Platform Features

  ## New Tables

  ### 1. themes
  Stores slide themes (system and user-created)
  - System themes: Classic, Modern, Minimal, Church Dark
  - Custom user themes

  ### 2. viewer_connections
  Tracks viewers connected to presentations

  ## Updates

  ### 1. presentations table
  - Add theme_id field
  - Add settings field for additional configuration

  ## Security
  - RLS policies for all new tables
  - System themes readable by all
  - User themes only by owner
*/

-- Create themes table if not exists
CREATE TABLE IF NOT EXISTS themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_system boolean DEFAULT false,
  font_family text DEFAULT 'Inter',
  font_size integer DEFAULT 48,
  text_color text DEFAULT '#FFFFFF',
  background_color text DEFAULT '#000000',
  background_gradient text,
  text_shadow boolean DEFAULT true,
  overlay_opacity decimal(3,2) DEFAULT 0.3,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create viewer_connections table if not exists
CREATE TABLE IF NOT EXISTS viewer_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES presentation_sessions(id) ON DELETE CASCADE,
  viewer_name text,
  connected_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now()
);

-- Add theme_id and settings to presentations if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'presentations' AND column_name = 'theme_id'
  ) THEN
    ALTER TABLE presentations ADD COLUMN theme_id uuid REFERENCES themes(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'presentations' AND column_name = 'settings'
  ) THEN
    ALTER TABLE presentations ADD COLUMN settings jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewer_connections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Everyone can view system themes" ON themes;
DROP POLICY IF EXISTS "Users can create own themes" ON themes;
DROP POLICY IF EXISTS "Users can update own themes" ON themes;
DROP POLICY IF EXISTS "Users can delete own themes" ON themes;
DROP POLICY IF EXISTS "Anyone can view connections" ON viewer_connections;
DROP POLICY IF EXISTS "Anyone can create viewer connections" ON viewer_connections;
DROP POLICY IF EXISTS "Anyone can update viewer connections" ON viewer_connections;

-- Themes policies
CREATE POLICY "Everyone can view system themes"
  ON themes FOR SELECT
  TO authenticated
  USING (is_system = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own themes"
  ON themes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can update own themes"
  ON themes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_system = false)
  WITH CHECK (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can delete own themes"
  ON themes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_system = false);

-- Viewer connections policies
CREATE POLICY "Anyone can view connections"
  ON viewer_connections FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create viewer connections"
  ON viewer_connections FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update viewer connections"
  ON viewer_connections FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_themes_user_id ON themes(user_id);
CREATE INDEX IF NOT EXISTS idx_themes_is_system ON themes(is_system);
CREATE INDEX IF NOT EXISTS idx_viewer_connections_session_id ON viewer_connections(session_id);
CREATE INDEX IF NOT EXISTS idx_presentations_theme_id ON presentations(theme_id);

-- Insert default system themes
INSERT INTO themes (name, is_system, font_family, font_size, text_color, background_color, text_shadow, overlay_opacity, settings)
VALUES
  ('Classic', true, 'Inter', 48, '#FFFFFF', '#000000', true, 0.3, '{"description": "Classic black background with white text"}'::jsonb),
  ('Modern', true, 'Inter', 52, '#FFFFFF', '#1a1a2e', true, 0.4, '{"description": "Modern dark blue with gradient", "gradient": "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"}'::jsonb),
  ('Minimal', true, 'Inter', 44, '#2c3e50', '#ecf0f1', false, 0.2, '{"description": "Clean minimal light background"}'::jsonb),
  ('Church Dark', true, 'Georgia', 50, '#f5f5f5', '#0f0f23', true, 0.5, '{"description": "Traditional church style with elegant serif font", "gradient": "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public)
VALUES ('presentation-media', 'presentation-media', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;

-- Storage policies for presentation-media bucket
CREATE POLICY "Users can upload own media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'presentation-media');

CREATE POLICY "Users can view media"
  ON storage.objects FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'presentation-media');

CREATE POLICY "Users can delete own media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'presentation-media');