/*
  # Fix sponsors RLS for public access
  
  1. Allow anonymous users to view active sponsors (for HomePage display)
  2. Keep authenticated users with full access
*/

DROP POLICY IF EXISTS "Authenticated users can view all sponsors" ON sponsors;

CREATE POLICY "Anyone can view active sponsors"
  ON sponsors FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Authenticated users can view all sponsors"
  ON sponsors FOR SELECT
  TO authenticated
  USING (true);