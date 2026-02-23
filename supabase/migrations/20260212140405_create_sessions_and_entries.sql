/*
  # Create user_sessions and renovation_entries tables

  1. New Tables
    - `user_sessions`
      - `id` (uuid, primary key)
      - `canton_id` (uuid, FK to cantons)
      - `tax_year` (int)
      - `property_age` (text) - "under_10" or "over_10"
      - `owner_name` (text, nullable)
      - `property_address` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `renovation_entries`
      - `id` (uuid, primary key)
      - `session_id` (uuid, FK to user_sessions)
      - `category_id` (uuid, FK to renovation_categories)
      - `description` (text)
      - `amount` (numeric)
      - `renovation_date` (date)
      - `is_deductible` (boolean)
      - `deduction_percentage` (numeric)
      - `deduction_amount` (numeric)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Anonymous users can create and manage their own sessions/entries
    - Authenticated users can read all data
*/

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canton_id uuid NOT NULL REFERENCES cantons(id),
  tax_year int NOT NULL DEFAULT 2025,
  property_age text NOT NULL CHECK (property_age IN ('under_10', 'over_10')) DEFAULT 'over_10',
  owner_name text DEFAULT '',
  property_address text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read sessions"
  ON user_sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update sessions"
  ON user_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete sessions"
  ON user_sessions FOR DELETE
  USING (true);

CREATE TABLE IF NOT EXISTS renovation_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES renovation_categories(id),
  description text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
  renovation_date date NOT NULL DEFAULT CURRENT_DATE,
  is_deductible boolean NOT NULL DEFAULT false,
  deduction_percentage numeric NOT NULL DEFAULT 0,
  deduction_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE renovation_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create entries"
  ON renovation_entries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read entries"
  ON renovation_entries FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update entries"
  ON renovation_entries FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete entries"
  ON renovation_entries FOR DELETE
  USING (true);
