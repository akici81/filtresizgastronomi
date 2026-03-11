import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
const PRICE_LABELS = { budget: '₺', moderate: '₺₺', expensive: '₺₺₺', luxury: '₺₺₺₺' };

export default function RestaurantsPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 12;

  useEffect(() => { fetchCities(); }, []);
  useEffect(() => { fetchRestaurants(); }, [search, cityFilter, priceFilter, sortBy, page]);

  async function fetchCities() {
    const { data } = await supabase.from('cities').select('id, name').eq('is_active', true).order('name');
    setCities(data || []);
  }

  async function fetchRestaurants() {
    setLoading(true);
    let query = supabase
      .from('restaurants')
      .select('id, name, slug, short_description, image_url, cuisine_type, price_range, average_rating, reviews_count, is_premium, is_verified, cities(name, slug)', { count: 'exact' })
      .eq('status', 'published')
      .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

    if (search) query = query.ilike('name', `%${search}%`);
    if (cityFilter) query = query.eq('city_id', cityFilter);
    if (priceFilter) query = query.eq('price_range', priceFilter);
    if (sortBy === 'rating') query = query.order('average_rating', { ascending: false });
    else if (sortBy === 'popular') query = query.order('reviews_count', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data, count } = await query;
    setRestaurants(data || []);
    setTotal(count || 0);
    setLoading(false);
  }

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <Layout>
      <Head>
        <title>Restoranlar | Filtresiz Gastronomi</title>
        <meta name="description" content="Türkiye'nin en iyi restoranları" />
      </Head>

      <div style={{ background: 'var(--hero-bg)', padding: '60px 0 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 40, fontWeight: 900, margin: '0 0 12px' }}>Restoranlar</h1>
          <p style={{ fontSize: 16, color: 'var(--dim)', margin: 0 }}>{total} restoran keşfedilmeyi bekliyor</p>
        </div>
      </div>

      <div style={{ borderBottom: `1px solid ${'var(--border)'}`, background: 'var(--filter-bg)', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 12, alignItems: 'center', height: 56, flexWrap: 'wrap' }}>
          <input type="text" placeholder="Restoran ara..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: 180, background: 'var(--input-bg)', border: `1px solid ${'var(--border)'}`, borderRadius: 6, padding: '8px 14px', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
          <select value={cityFilter} onChange={e => { setCityFilter(e.target.value); setPage(1); }}
            style={{ background: 'var(--input-bg)', border: `1px solid ${'var(--border)'}`, borderRadius: 6, padding: '8px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="">Tüm Şehirler</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={priceFilter} onChange={e => { setPriceFilter(e.target.value); setPage(1); }}
            style={{ background: 'var(--input-bg)', border: `1px solid ${'var(--border)'}`, borderRadius: 6, padding: '8px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="">Tüm Fiyatlar</option>
            <option value="budget">₺ Ekonomik</option>
            <option value="moderate">₺₺ Orta</option>
            <option value="expensive">₺₺₺ Pahalı</option>
            <option value="luxury">₺₺₺₺ Lüks</option>
          </select>
          <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
            style={{ background: 'var(--input-bg)', border: `1px solid ${'var(--border)'}`, borderRadius: 6, padding: '8px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="created_at">En Yeni</option>
            <option value="rating">En Yüksek Puan</option>
            <option value="popular">En Popüler</option>
          </select>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {[...Array(12)].map((_, i) => <div key={i} style={{ height: 340, borderRadius: 12, background: 'var(--card)', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : restaurants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
            <div>Sonuç bulunamadı</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {restaurants.map(r => (
              <div key={r.id} onClick={() => router.push(`/restaurant/${r.slug}`)}
                style={{ cursor: 'pointer', background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 12, overflow: 'hidden', transition: 'transform 0.2s, border-color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(232,0,13,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                  {r.image_url
                    ? <img src={r.image_url} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', background: 'rgba(232,0,13,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🏪</div>}
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
                    {r.is_premium && <Badge color={'var(--red)'}>Premium</Badge>}
                    {r.is_verified && <Badge color="#10b981">✓ Doğrulandı</Badge>}
                  </div>
                  {r.price_range && (
                    <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--overlay-bg)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: 20, fontSize: 12, color: '#f59e0b', fontWeight: 700 }}>
                      {PRICE_LABELS[r.price_range]}
                    </div>
                  )}
                </div>
                <div style={{ padding: 20 }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700 }}>{r.name}</h3>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                    {r.cities?.name && <span style={{ fontSize: 12, color: 'var(--red)' }}>📍 {r.cities.name}</span>}
                    {r.cuisine_type && <span style={{ fontSize: 12, color: 'var(--dim)' }}>{r.cuisine_type}</span>}
                  </div>
                  {r.short_description && <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--dim)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.short_description}</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {r.average_rating > 0
                      ? <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ color: '#f59e0b' }}>★</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{Number(r.average_rating).toFixed(1)}</span>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>({r.reviews_count})</span>
                        </div>
                      : <span style={{ fontSize: 12, color: 'var(--muted)' }}>Değerlendirme yok</span>}
                    <span style={{ fontSize: 12, color: 'var(--dim)' }}>Detay →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48 }}>
            <PageBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</PageBtn>
            {[...Array(Math.min(totalPages, 7))].map((_, i) => <PageBtn key={i} onClick={() => setPage(i + 1)} active={page === i + 1}>{i + 1}</PageBtn>)}
            <PageBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</PageBtn>
          </div>
        )}
      </div>
    </Layout>
  );
}

function Badge({ children, color }) {
  return <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{children}</span>;
}

function PageBtn({ children, onClick, disabled, active }) {
  return <button onClick={onClick} disabled={disabled} style={{ width: 36, height: 36, borderRadius: 6, border: `1px solid ${active ? 'var(--red)' : 'var(--border)'}`, background: active ? 'var(--red)' : 'transparent', color: active ? 'var(--text)' : disabled ? 'var(--muted)' : 'var(--dim)', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13 }}>{children}</button>;
}
