/*
  # Create cantons table with seed data for all 26 Swiss cantons

  1. New Tables
    - `cantons`
      - `id` (uuid, primary key)
      - `name` (text) - Full canton name in German
      - `abbreviation` (text) - 2-letter canton code (e.g. "ZH")
      - `flat_rate_new` (numeric) - Flat-rate deduction % for buildings up to 10 years old
      - `flat_rate_old` (numeric) - Flat-rate deduction % for buildings over 10 years old
      - `flat_rate_basis` (text) - Measurement basis for flat-rate deduction
      - `flat_rate_notes` (text) - Special rules or limits
      - `energy_deduction_allowed` (boolean) - Whether energy-saving investments are deductible
      - `energy_waiting_years` (int) - Waiting period in years after new construction for energy deductions
      - `energy_deduction_notes` (text) - Special notes for energy deductions
      - `sort_order` (int) - Display order
      - `is_active` (boolean) - Whether canton is active

  2. Security
    - Enable RLS on `cantons` table
    - Add policy for anonymous users to read active cantons
    - Add policy for authenticated users to manage cantons

  3. Seed Data
    - All 26 Swiss cantons with official ESTV 2025 flat-rate deduction percentages
*/

CREATE TABLE IF NOT EXISTS cantons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  abbreviation text NOT NULL UNIQUE,
  flat_rate_new numeric NOT NULL DEFAULT 10,
  flat_rate_old numeric NOT NULL DEFAULT 20,
  flat_rate_basis text NOT NULL DEFAULT 'Brutto-Mietertrag bzw. Eigenmietwert',
  flat_rate_notes text DEFAULT '',
  energy_deduction_allowed boolean NOT NULL DEFAULT true,
  energy_waiting_years int NOT NULL DEFAULT 5,
  energy_deduction_notes text DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cantons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active cantons"
  ON cantons FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert cantons"
  ON cantons FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cantons"
  ON cantons FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cantons"
  ON cantons FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO cantons (name, abbreviation, flat_rate_new, flat_rate_old, flat_rate_basis, flat_rate_notes, energy_deduction_allowed, energy_waiting_years, energy_deduction_notes, sort_order) VALUES
('Zürich', 'ZH', 20, 20, 'Brutto-Mietertrag bzw. Eigenmietwert', 'Keine Altersunterscheidung, immer 20%', true, 0, 'Gleiche Regelung wie Bund', 1),
('Bern', 'BE', 10, 20, 'Brutto-Gebäudeertrag', '', true, 5, 'Gleiche Regelung wie Bund', 2),
('Luzern', 'LU', 10, 20, 'Brutto-Mietertrag oder steuerbarer Mietwert', 'Pauschalabzug wird gekürzt wenn Unterhalt teils von Mieterschaft getragen', false, 3, 'Energiesparmassnahmen nicht abzugsfähig; PV-Anlage innert 3 Jahren nach Neubau nicht abzugsfähig', 3),
('Uri', 'UR', 10, 20, 'Mietertrag bzw. Eigenmietwert', '', true, 5, 'PV-Anlagen innert 5 Jahren seit Erstellung nicht abzugsfähig', 4),
('Schwyz', 'SZ', 10, 20, 'Bruttomietertrag, Eigenmietwert bzw. Eigennutzungswert', '', true, 5, 'Energiesparmassnahmen in Neubauten innert 5 Jahren gelten als Anlagekosten', 5),
('Obwalden', 'OW', 10, 20, 'Brutto-Mietertrag bzw. Eigenmietwert', '', true, 5, 'PV-Anlagen innert 5 Jahren seit Erstellung nicht abzugsfähig', 6),
('Nidwalden', 'NW', 10, 20, 'Rohertrag', '', true, 5, 'Gleiche Regelung wie Bund', 7),
('Glarus', 'GL', 10, 20, 'Brutto-Mietertrag bzw. Eigenmietwert', 'Kein Pauschalabzug bei unüberbauten und baurechtsbelasteten Grundstücken', true, 5, 'Abzüge nicht für Neubauten; PV-Anlagen: 5-jährige Sperrfrist', 8),
('Zug', 'ZG', 10, 20, 'Brutto-Mietertrag bzw. Eigenmietwert', '', true, 5, 'Gleiche Regelung wie Bund', 9),
('Freiburg', 'FR', 10, 20, 'Brutto-Mietertrag bzw. Eigenmietwert', 'Kein Pauschalabzug bei unüberbauten Grundstücken oder Baurechtsrenten', true, 5, 'Gleiche Regelung wie Bund', 10),
('Solothurn', 'SO', 10, 20, 'Bruttoertrag (Mietwert oder Mietertrag ohne Nebenkosten)', '', true, 5, 'Kein Abzug innert 5 Jahren nach Neubau', 11),
('Basel-Stadt', 'BS', 10, 20, 'Mietertrag (ohne Nebenkosten) bzw. Eigenmietwert', '', true, 5, 'Kein Abzug innert 5 Jahren nach Fertigstellung Neubau', 12),
('Basel-Landschaft', 'BL', 20, 25, 'Brutto-Mietertrag oder Eigenmietwert', 'Höhere Pauschalabzüge als die meisten Kantone', true, 5, 'Gleiche Regelung wie Bund', 13),
('Schaffhausen', 'SH', 15, 25, 'Brutto-Mietertrag bzw. Eigenmietwert', 'Kein Pauschalabzug bei Bruttomietertrag über 90''000 Fr.', true, 5, 'Bestehend = mind. 5 Jahre alt ab erster Schätzung', 14),
('Appenzell Ausserrhoden', 'AR', 10, 20, 'Brutto-Mietertrag', 'Kein Pauschalabzug bei jährlichem Brutto-Mietertrag über 100''000 Fr.', true, 5, 'PV innert 5 Jahren nach Neubau = Anlagekosten', 15),
('Appenzell Innerrhoden', 'AI', 20, 20, 'Brutto-Mietertrag bzw. Eigenmietwert', 'Keine Altersunterscheidung, immer 20%', true, 5, 'Gleiche Regelung wie Bund', 16),
('St. Gallen', 'SG', 20, 20, 'Brutto-Mietertrag ohne Nebenkosten oder angerechneter Eigenmietwert', 'Keine Altersunterscheidung, immer 20%', true, 2, 'Bestehende Baute = Zeitraum > 2 Jahre seit Erstellung', 17),
('Graubünden', 'GR', 10, 20, 'Brutto-Mietertrag bzw. Eigenmietwert', 'Kein Pauschalabzug bei Bruttoertrag über 153''000 Fr.', true, 5, 'Gleiche Regelung wie Bund', 18),
('Aargau', 'AG', 10, 20, 'Mietrohertrag oder Eigenmietwert', '', true, 5, 'Energiesparmassnahmen frühestens 5 Jahre nach Erstellung abzugsfähig', 19),
('Thurgau', 'TG', 10, 20, 'Brutto-Mietertrag bzw. Eigenmietwert', 'Kein Pauschalabzug bei Brutto-Mietertrag über 50''000 Fr.', true, 5, 'Bei Neubauten: gesamte Investitionskosten inkl. PV = wertvermehrend; 5 Jahre Frist', 20),
('Tessin', 'TI', 10, 20, 'Brutto-Mietertrag bzw. Eigenmietwert', '', true, 5, 'PV-Anlagen abzugsfähig bei Gebäuden mind. 5 Jahre alt', 21),
('Waadt', 'VD', 20, 30, 'Eigenmietwert (selbstbewohnt)', 'Selbstbewohnt: 20%/30%; Vermietet: 10%/20%; Kein Pauschalabzug bei Bruttomietertrag über 150''000 Fr.', true, 5, 'Gleiche Regelung wie Bund', 22),
('Wallis', 'VS', 10, 20, 'Brutto-Mietertrag bzw. Eigenmietwert', '', true, 5, 'Innert 5 Jahren nicht abzugsfähig, Ausnahme: PV/Solarthermie auf Hauptwohnsitz sofort abzugsfähig', 23),
('Neuenburg', 'NE', 10, 20, 'Brutto-Mietertrag bzw. Eigenmietwert', 'Max. CHF 7''200 (bis 10 J.) bzw. CHF 12''000 (über 10 J.)', true, 2, 'Erneuerbare Energien nicht abzugsfähig innert 2 Jahren nach Bau', 24),
('Genf', 'GE', 15, 25, 'Eigenmietwert nach Abzug', '', true, 5, 'Gleiche Regelung wie Bund', 25),
('Jura', 'JU', 10, 20, 'Brutto-Mietertrag bzw. Eigenmietwert', '', true, 2, 'Energiesparmassnahmen nicht abzugsfähig innert 2 Jahren nach Bau/Umbau (inkl. PV, Batterien, Öfen)', 26);
