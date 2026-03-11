import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
export default function ChefsPage() {
  const router = useRouter();
  const [chefs, setChefs] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => { fetchCities(); }, []);
  useEffect(() => { fetchChefs(); }, [search, cityFilter]);

  async function fetchCities() {
    const { data } = await supabase.from('cities').select('id, name').eq('is_active', true).order('name');
    setCities(data || []);
  }

  async function fetchChefs() {
    setLoading(true);
    let query = supabase
      .from('chefs')
      .select('id, name, slug, title, short_bio, image_url, is_featured, cities(name, slug)')
      .eq('status', 'published')
      .order('is_featured', { ascending: false })
      .order('name');

    if (search) query = query.ilike('name', `%${search}%`);
    if (cityFilter) query = query.eq('city_id', cityFilter);

    const { data } = await query;
    setChefs(data || []);
    setLoading(false);
  }

  return (
    <Layout>
      <Head>
        <title>Şefler | Filtresiz Gastronomi</title>
        <meta name="description" content="Türkiye'nin usta şefleri" />
      </Head>

      <div style={{ background: 'var(--hero-bg)', padding: '60px 0 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 40, fontWeight: 900, margin: '0 0 12px' }}>Şefler</h1>
          <p style={{ fontSize: 16, color: 'var(--dim)', margin: 0 }}>Türkiye'nin usta mutfak ustalarını tanıyın</p>
        </div>
      </div>

      <div style={{ borderBottom: `1px solid ${'var(--border)'}`, background: 'var(--filter-bg)', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 12, alignItems: 'center', height: 56 }}>
          <input type="text" placeholder="Şef ara..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, background: 'var(--input-bg)', border: `1px solid ${'var(--border)'}`, borderRadius: 6, padding: '8px 14px', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
          <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
            style={{ background: 'var(--input-bg)', border: `1px solid ${'var(--border)'}`, borderRadius: 6, padding: '8px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="">Tüm Şehirler</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {[...Array(8)].map((_, i) => <div key={i} style={{ height: 320, borderRadius: 12, background: 'var(--card)', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : chefs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍🍳</div>
            <div>Sonuç bulunamadı</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {chefs.map(chef => (
              <div key={chef.id} onClick={() => router.push(`/chef/${chef.slug}`)}
                style={{ cursor: 'pointer', background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 12, overflow: 'hidden', transition: 'transform 0.2s, border-color 0.2s', textAlign: 'center' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(232,0,13,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                <div style={{ height: 220, overflow: 'hidden', position: 'relative' }}>
                  {chef.image_url
                    ? <img src={chef.image_url} alt={chef.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                    : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(232,0,13,0.2), rgba(232,0,13,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700 }}>{chef.name[0]}</div>
                      </div>}
                  {chef.is_featured && (
                    <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--red)', padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em' }}>ÖNE ÇIKAN</div>
                  )}
                </div>
                <div style={{ padding: 20 }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>{chef.name}</h3>
                  {chef.title && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>{chef.title}</div>}
                  {chef.cities?.name && <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 10 }}>📍 {chef.cities.name}</div>}
                  {chef.short_bio && <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{chef.short_bio}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
