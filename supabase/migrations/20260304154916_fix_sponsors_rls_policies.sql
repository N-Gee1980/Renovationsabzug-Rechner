/*
  # Fix sponsors RLS policies
  
  1. Drop existing restrictive policies
  2. Create improved policies that allow authenticated users to manage sponsors
  3. Policies allow public view of active sponsors, authenticated users full access
*/

DROP POLICY IF EXISTS "Authenticated users can insert sponsors" ON sponsors;
DROP POLICY IF EXISTS "Authenticated users can update sponsors" ON sponsors;
DROP POLICY IF EXISTS "Authenticated users can delete sponsors" ON sponsors;
DROP POLICY IF EXISTS "Authenticated users can view all sponsors" ON sponsors;

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