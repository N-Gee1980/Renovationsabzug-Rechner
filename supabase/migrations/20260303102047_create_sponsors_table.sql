/*
  # Create sponsors table

  1. New Tables
    - `sponsors`
      - `id` (uuid, primary key)
      - `name` (text, sponsor name)
      - `url` (text, sponsor website URL)
      - `image_url` (text, banner/logo image URL)
      - `alt_text` (text, alternative text for accessibility)
      - `active` (boolean, whether the sponsor is displayed)
      - `order` (integer, sorting order on display)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `sponsors` table
    - Add policy for public SELECT (anyone can view active sponsors)
    - Add policies for authenticated admins to manage sponsors
*/

CREATE TABLE IF NOT EXISTS sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  image_url text NOT NULL,
  alt_text text DEFAULT '',
  active boolean DEFAULT true,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active sponsors"
  ON sponsors FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Authenticated users can view all sponsors"
  ON sponsors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sponsors"
  ON sponsors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sponsors"
  ON sponsors FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sponsors"
  ON sponsors FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX idx_sponsors_active_order ON sponsors(active DESC, "order" ASC);
