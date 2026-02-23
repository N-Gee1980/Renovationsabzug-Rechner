/*
  # Create canton_category_rules table

  1. New Tables
    - `canton_category_rules`
      - `id` (uuid, primary key)
      - `canton_id` (uuid, FK to cantons)
      - `category_id` (uuid, FK to renovation_categories)
      - `tax_year` (int) - The tax year this rule applies to
      - `is_deductible` (boolean) - Whether this category is deductible in this canton
      - `deduction_percentage` (numeric) - Percentage of deduction (0-100)
      - `max_amount` (numeric, nullable) - Maximum deductible amount
      - `notes` (text) - Special notes for this rule
      - Unique constraint on (canton_id, category_id, tax_year)

  2. Security
    - Enable RLS
    - Anonymous can read rules
    - Authenticated can manage rules
*/

CREATE TABLE IF NOT EXISTS canton_category_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canton_id uuid NOT NULL REFERENCES cantons(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES renovation_categories(id) ON DELETE CASCADE,
  tax_year int NOT NULL DEFAULT 2025,
  is_deductible boolean NOT NULL DEFAULT true,
  deduction_percentage numeric NOT NULL DEFAULT 100 CHECK (deduction_percentage >= 0 AND deduction_percentage <= 100),
  max_amount numeric,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(canton_id, category_id, tax_year)
);

ALTER TABLE canton_category_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rules"
  ON canton_category_rules FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert rules"
  ON canton_category_rules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rules"
  ON canton_category_rules FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete rules"
  ON canton_category_rules FOR DELETE
  TO authenticated
  USING (true);
