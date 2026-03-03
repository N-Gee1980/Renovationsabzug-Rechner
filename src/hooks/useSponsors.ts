import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Sponsor {
  id: string;
  name: string;
  url: string;
  image_url: string;
  alt_text: string;
  active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export const useSponsors = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('sponsors')
          .select('*')
          .eq('active', true)
          .order('order', { ascending: true });

        if (fetchError) throw fetchError;
        setSponsors(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sponsors');
        setSponsors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, []);

  return { sponsors, loading, error };
};

export const useAllSponsors = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('sponsors')
          .select('*')
          .order('order', { ascending: true });

        if (fetchError) throw fetchError;
        setSponsors(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sponsors');
        setSponsors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, []);

  return { sponsors, loading, error };
};
