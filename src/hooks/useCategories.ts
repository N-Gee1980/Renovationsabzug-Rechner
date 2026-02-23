import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RenovationCategory } from '../lib/types';

const CACHE_KEY = 'cache-categories';
let moduleCache: RenovationCategory[] = [];

function readCache(): RenovationCategory[] {
  if (moduleCache.length > 0) return moduleCache;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        moduleCache = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [];
}

function writeCache(data: RenovationCategory[]) {
  moduleCache = data;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function useCategories() {
  const [categories, setCategories] = useState<RenovationCategory[]>(readCache);
  const [loading, setLoading] = useState(categories.length === 0);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('renovation_categories')
      .select('*')
      .order('sort_order');
    const result = data ?? [];
    setCategories(result);
    writeCache(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('renovation_categories')
        .select('*')
        .order('sort_order');
      if (cancelled) return;
      const result = data ?? [];
      setCategories(result);
      writeCache(result);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  return { categories, loading, reload };
}
