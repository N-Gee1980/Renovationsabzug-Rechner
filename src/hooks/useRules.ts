import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { CantonCategoryRule } from '../lib/types';

export function useRules(cantonId?: string, taxYear?: number) {
  const [rules, setRules] = useState<CantonCategoryRule[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRules = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('canton_category_rules').select('*');
    if (cantonId) query = query.eq('canton_id', cantonId);
    if (taxYear) query = query.eq('tax_year', taxYear);
    const { data } = await query;
    setRules(data ?? []);
    setLoading(false);
  }, [cantonId, taxYear]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  function getRuleForCategory(categoryId: string): CantonCategoryRule | undefined {
    return rules.find(r => r.category_id === categoryId);
  }

  return { rules, loading, reload: loadRules, getRuleForCategory };
}
