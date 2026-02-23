/*
  # Seed canton_category_rules for tax year 2025

  Generates default rules for all canton/category combinations:
  - Werterhaltend categories: 100% deductible in all cantons
  - Energiesparend categories: 100% deductible (except LU where energy measures are not deductible)
  - Wertvermehrend categories: 0% / not deductible in all cantons
*/

INSERT INTO canton_category_rules (canton_id, category_id, tax_year, is_deductible, deduction_percentage, notes)
SELECT
  c.id,
  rc.id,
  2025,
  CASE
    WHEN rc.deduction_type = 'wertvermehrend' THEN false
    WHEN rc.deduction_type = 'energiesparend' AND c.abbreviation = 'LU' THEN false
    ELSE true
  END,
  CASE
    WHEN rc.deduction_type = 'wertvermehrend' THEN 0
    WHEN rc.deduction_type = 'energiesparend' AND c.abbreviation = 'LU' THEN 0
    ELSE 100
  END,
  CASE
    WHEN rc.deduction_type = 'wertvermehrend' THEN 'Wertvermehrende Investitionen sind nicht vom Einkommen abzugsfähig. Bei Verkauf als Anlagekosten anrechenbar.'
    WHEN rc.deduction_type = 'energiesparend' AND c.abbreviation = 'LU' THEN 'Im Kanton Luzern sind Energiesparmassnahmen grundsätzlich nicht abzugsfähig.'
    WHEN rc.deduction_type = 'energiesparend' THEN 'Abzugsfähig als Energiespar-/Umweltschutzmassnahme. Karenzfrist nach Neubau beachten.'
    ELSE 'Werterhaltende Unterhaltskosten sind vollumfänglich abzugsfähig.'
  END
FROM cantons c
CROSS JOIN renovation_categories rc
WHERE c.is_active = true AND rc.is_active = true;
