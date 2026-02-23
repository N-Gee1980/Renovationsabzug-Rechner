import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { UserSession, RenovationEntry } from '../lib/types';

export function useUserSession(sessionId: string | undefined) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [entries, setEntries] = useState<RenovationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    const { data } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();
    setSession(data);
    setLoading(false);
  }, [sessionId]);

  const loadEntries = useCallback(async () => {
    if (!sessionId) return;
    const { data } = await supabase
      .from('renovation_entries')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    setEntries(data ?? []);
  }, [sessionId]);

  useEffect(() => {
    loadSession();
    loadEntries();
  }, [loadSession, loadEntries]);

  async function addEntry(entry: {
    category_id: string;
    description: string;
    amount: number;
    renovation_date: string;
    is_deductible: boolean;
    deduction_percentage: number;
    deduction_amount: number;
  }) {
    if (!sessionId) return null;
    const { data, error } = await supabase
      .from('renovation_entries')
      .insert({ ...entry, session_id: sessionId })
      .select()
      .maybeSingle();
    if (!error && data) {
      setEntries(prev => [data, ...prev]);
    }
    return { data, error };
  }

  async function deleteEntry(entryId: string) {
    const { error } = await supabase
      .from('renovation_entries')
      .delete()
      .eq('id', entryId);
    if (!error) {
      setEntries(prev => prev.filter(e => e.id !== entryId));
    }
    return { error };
  }

  async function updateEntry(entryId: string, updates: Partial<Pick<RenovationEntry, 'category_id' | 'description' | 'amount' | 'renovation_date' | 'is_deductible' | 'deduction_percentage' | 'deduction_amount'>>) {
    const { data, error } = await supabase
      .from('renovation_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .maybeSingle();
    if (!error && data) {
      setEntries(prev => prev.map(e => e.id === entryId ? data : e));
    }
    return { data, error };
  }

  async function updateSessionDetails(updates: Partial<Pick<UserSession, 'canton_id' | 'tax_year' | 'property_age' | 'owner_name' | 'property_address' | 'eigenmietwert'>>) {
    if (!sessionId) return;
    await supabase
      .from('user_sessions')
      .update(updates)
      .eq('id', sessionId);
    await loadSession();
  }

  return { session, entries, loading, addEntry, updateEntry, deleteEntry, updateSessionDetails, reload: loadEntries };
}
