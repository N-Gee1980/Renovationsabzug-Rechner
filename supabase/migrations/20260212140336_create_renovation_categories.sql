/*
  # Create renovation categories table with seed data

  1. New Tables
    - `renovation_categories`
      - `id` (uuid, primary key)
      - `name` (text) - Category name in German
      - `description` (text) - Short description
      - `icon_name` (text) - Lucide icon name
      - `deduction_type` (text) - One of: werterhaltend, wertvermehrend, energiesparend
      - `is_active` (boolean)
      - `sort_order` (int)

  2. Security
    - Enable RLS
    - Anonymous can read active categories
    - Authenticated can manage all categories

  3. Seed Data
    - 12 standard renovation categories covering all common renovation types
*/

CREATE TABLE IF NOT EXISTS renovation_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon_name text NOT NULL DEFAULT 'Wrench',
  deduction_type text NOT NULL CHECK (deduction_type IN ('werterhaltend', 'wertvermehrend', 'energiesparend')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE renovation_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active categories"
  ON renovation_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert categories"
  ON renovation_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON renovation_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON renovation_categories FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO renovation_categories (name, description, icon_name, deduction_type, sort_order) VALUES
('Malerarbeiten & Tapezieren', 'Innen- und Aussenanstriche, Tapeten, Verputzarbeiten', 'Paintbrush', 'werterhaltend', 1),
('Sanitär & Leitungen', 'Reparatur/Ersatz von Wasserleitungen, Abwasser, Sanitäranlagen', 'Droplets', 'werterhaltend', 2),
('Küche & Bad (gleichwertiger Ersatz)', 'Gleichwertiger Ersatz von Küchen- und Badeinrichtungen', 'ChefHat', 'werterhaltend', 3),
('Haushaltgeräte (Ersatz)', 'Ersatz von Waschmaschine, Geschirrspüler, Backofen etc.', 'Refrigerator', 'werterhaltend', 4),
('Dach & Fassade', 'Dachsanierung, Fassadenrenovation, Spenglerarbeiten', 'Home', 'werterhaltend', 5),
('Fenster & Türen (gleichwertiger Ersatz)', 'Gleichwertiger Ersatz bestehender Fenster und Türen', 'DoorOpen', 'werterhaltend', 6),
('Boden & Wände', 'Ersatz von Bodenbelägen, Plattenarbeiten, Schreinerarbeiten', 'Layers', 'werterhaltend', 7),
('Garten & Umgebung', 'Gartenunterhalt, Wege, Zäune, Rasen', 'TreePine', 'werterhaltend', 8),
('Gebäudeversicherung & Verwaltung', 'Gebäudeversicherungsprämien, Verwaltungskosten durch Dritte', 'Shield', 'werterhaltend', 9),
('Heizungsersatz & Wärmepumpe', 'Ersatz fossiler Heizung durch Wärmepumpe, Pelletheizung, Fernwärme', 'Flame', 'energiesparend', 10),
('Wärmedämmung & Isolation', 'Fassadendämmung, Dachdämmung, Kellerdeckendämmung', 'Thermometer', 'energiesparend', 11),
('Fenster (energetische Verbesserung)', 'Ersatz durch energetisch bessere Fenster (höherer U-Wert)', 'Sun', 'energiesparend', 12),
('Solaranlage & Photovoltaik', 'Installation von PV-Anlagen, Solarthermie, Batteriespeicher', 'Zap', 'energiesparend', 13),
('Lüftung & Klimatechnik', 'Kontrollierte Wohnraumlüftung, Wärmerückgewinnung', 'Wind', 'energiesparend', 14),
('Anbau & Ausbau', 'Wintergarten, Dachausbau, Garage, zusätzliche Räume', 'Building2', 'wertvermehrend', 15),
('Luxusrenovation & Upgrade', 'Hochwertigere Materialien, Luxusküche, Spa-Bad, Smart Home', 'Gem', 'wertvermehrend', 16),
('Swimmingpool & Wellness', 'Einbau von Pool, Sauna, Whirlpool', 'Waves', 'wertvermehrend', 17);
