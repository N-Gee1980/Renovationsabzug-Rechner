import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Canton } from '../lib/types';

const CACHE_KEY = 'cache-cantons';
let moduleCache: Canton[] = [];

function readCache(): Canton[] {
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

function writeCache(data: Canton[]) {
  moduleCache = data;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function useCantons() {
  const [cantons, setCantons] = useState<Canton[]>(readCache);
  const [loading, setLoading] = useState(cantons.length === 0);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('cantons')
      .select('*')
      .order('sort_order');
    const result = data ?? [];
    setCantons(result);
    writeCache(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('cantons')
        .select('*')
        .order('sort_order');
      if (cancelled) return;
      const result = data ?? [];
      setCantons(result);
      writeCache(result);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  return { cantons, loading, reload };
}
