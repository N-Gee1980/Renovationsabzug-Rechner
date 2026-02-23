/*
  # Add Eigenmietwert column to user_sessions

  1. Modified Tables
    - `user_sessions`
      - Added `eigenmietwert` (numeric, nullable, default 0) - Optional imputed rental value
        so the summary can compare the flat-rate deduction against itemized costs

  2. Notes
    - Column is optional (default 0) so existing sessions are unaffected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'eigenmietwert'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN eigenmietwert numeric NOT NULL DEFAULT 0;
  END IF;
END $$;
