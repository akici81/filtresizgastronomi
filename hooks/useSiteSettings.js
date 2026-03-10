import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSiteSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .eq('is_public', true);

    if (data) {
      const obj = {};
      data.forEach(({ key, value }) => {
        obj[key] = value;
      });
      setSettings(obj);
    }
    setLoading(false);
  }

  return { settings, loading };
}