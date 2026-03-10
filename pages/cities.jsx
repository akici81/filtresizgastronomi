import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/constants';

const REGIONS = [
  { value: '', label: 'Tüm Bölgeler' },
  { value: 'marmara', label: 'Marmara' },
  { value: 'ege', label: 'Ege' },
  { value: 'akdeniz', label: 'Akdeniz' },
  { value: 'ic_anadolu', label: 'İç Anadolu' },
  { value: 'karadeniz', label: 'Karadeniz' },
  { value: 'dogu_anadolu', label: 'Doğu Anadolu' },
  { value: 'guneydogu_anadolu', label: 'Güneydoğu Anadolu' },
];

export default function CitiesPage() {
  const router = useRouter();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');

  useEffect(() => { fetchCities(); }, [search, region]);

  async function fetchCities() {
    setLoading(true);
    let query = supabase
      .from('cities')
      .select('id, name, slug, region, short_description, image_url, dishes_count, restaurants_count, is_featured')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('name');

    if (search) query = query.ilike('name', `%${search}%`);
    if (region) query = query.eq('region', region);

    const { data } = await query;
    setCities(data || []);
    setLoading(false);
  }

  return (
    <Layout>
      <Head>
        <title>Şehirler | Filtresiz Gastronomi</title>
        <meta name="description" content="Türkiye'nin gastronomi şehirlerini keşfet" />
      </Head>

      <div style={{ background: 'linear-gradient(180deg, #1a0000 0%, #0d0d0d 100%)', padding: '60px 0 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 40, fontWeight: 900, margin: '0 0 12px' }}>Şehirler</h1>
          <p style={{ fontSize: 16, color: COLORS.dim, margin: 0 }}>Türkiye'nin gastronomi başkentlerini keşfet</p>
        </div>
      </div>

      <div style={{ borderBottom: `1px solid ${COLORS.border}`, background: '#0d0d0d', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 12, alignItems: 'center', height: 56 }}>
          <input type="text" placeholder="Şehir ara..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 14px', color: COLORS.white, fontSize: 13, outline: 'none' }} />
          <select value={region} onChange={e => setRegion(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 14px', color: COLORS.white, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
            {[...Array(9)].map((_, i) => <div key={i} style={{ height: 260, borderRadius: 12, background: COLORS.card, animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : cities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: COLORS.muted }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗺</div>
            <div>Sonuç bulunamadı</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
            {cities.map(city => (
              <div key={city.id} onClick={() => router.push(`/city/${city.slug}`)}
                style={{ cursor: 'pointer', position: 'relative', borderRadius: 12, overflow: 'hidden', height: 260, transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                {city.image_url
                  ? <img src={city.image_url} alt={city.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                  : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a0000, #2a0a0a)' }} />}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
                {city.is_featured && (
                  <div style={{ position: 'absolute', top: 16, right: 16, background: COLORS.red, padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>ÖNE ÇIKAN</div>
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4, letterSpacing: '0.1em' }}>
                    {REGIONS.find(r => r.value === city.region)?.label || city.region}
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800 }}>{city.name}</h3>
                  {city.short_description && (
                    <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {city.short_description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 16 }}>
                    {city.dishes_count > 0 && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>🍽 {city.dishes_count} yemek</span>}
                    {city.restaurants_count > 0 && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>🏪 {city.restaurants_count} restoran</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
