/*
  # Add Slides Table and Enhance Presentations System

  1. New Table
    - `slides` table for structured slide management (alternative to JSONB array)
      - Supports individual slide CRUD operations
      - Better for large presentations
      - Enables drag-and-drop reordering
  
  2. Enhancements
    - Add description field to presentations if not exists
    - Add support for both JSONB slides and relational slides approaches

  3. Security
    - Enable RLS on slides table
    - Slides inherit permissions from parent presentation
*/

-- Create slides table (alternative to JSONB array approach)
CREATE TABLE IF NOT EXISTS slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id uuid REFERENCES presentations(id) ON DELETE CASCADE NOT NULL,
  slide_order integer NOT NULL DEFAULT 0,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  slide_theme text,
  background_image text,
  background_video text,
  text_style jsonb DEFAULT '{"fontSize": 32, "color": "#ffffff", "bold": false, "italic": false}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add description field to presentations if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'presentations' AND column_name = 'description'
  ) THEN
    ALTER TABLE presentations ADD COLUMN description text;
  END IF;
END $$;

-- Enable RLS on slides
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;

-- Slides RLS Policies
CREATE POLICY "Users can view slides of own presentations"
  ON slides FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = slides.presentation_id
      AND presentations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create slides in own presentations"
  ON slides FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = slides.presentation_id
      AND presentations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update slides in own presentations"
  ON slides FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = slides.presentation_id
      AND presentations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = slides.presentation_id
      AND presentations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete slides in own presentations"
  ON slides FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = slides.presentation_id
      AND presentations.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_slides_presentation_id ON slides(presentation_id);
CREATE INDEX IF NOT EXISTS idx_slides_order ON slides(presentation_id, slide_order);

-- Create trigger for updated_at on slides
DROP TRIGGER IF EXISTS update_slides_updated_at ON slides;
CREATE TRIGGER update_slides_updated_at
  BEFORE UPDATE ON slides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
