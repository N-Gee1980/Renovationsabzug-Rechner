export interface Canton {
  id: string;
  name: string;
  abbreviation: string;
  flat_rate_new: number;
  flat_rate_old: number;
  flat_rate_basis: string;
  flat_rate_notes: string;
  energy_deduction_allowed: boolean;
  energy_waiting_years: number;
  energy_deduction_notes: string;
  sort_order: number;
  is_active: boolean;
}

export interface RenovationCategory {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  deduction_type: 'werterhaltend' | 'wertvermehrend' | 'energiesparend';
  is_active: boolean;
  sort_order: number;
}

export interface CantonCategoryRule {
  id: string;
  canton_id: string;
  category_id: string;
  tax_year: number;
  is_deductible: boolean;
  deduction_percentage: number;
  max_amount: number | null;
  notes: string;
}

export interface UserSession {
  id: string;
  canton_id: string;
  tax_year: number;
  property_age: 'under_10' | 'over_10';
  owner_name: string;
  property_address: string;
  eigenmietwert: number;
  created_at: string;
}

export interface RenovationEntry {
  id: string;
  session_id: string;
  category_id: string;
  description: string;
  amount: number;
  renovation_date: string;
  is_deductible: boolean;
  deduction_percentage: number;
  deduction_amount: number;
  created_at: string;
}

export type PropertyAge = 'under_10' | 'over_10';
