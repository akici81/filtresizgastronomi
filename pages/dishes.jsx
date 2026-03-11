import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { COLORS, DISH_CATEGORIES } from '../lib/constants';

export default function DishesPage() {
  const router = useRouter();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 12;

  useEffect(() => { fetchDishes(); }, [search, category, sortBy, page]);

  async function fetchDishes() {
    setLoading(true);
    let query = supabase
      .from('dishes')
      .select('id, name, slug, short_description, image_url, category, difficulty_level, average_rating, reviews_count, cities(name, slug)', { count: 'exact' })
      .eq('status', 'published')
      .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

    if (search) query = query.ilike('name', `%${search}%`);
    if (category) query = query.eq('category', category);
    if (sortBy === 'rating') query = query.order('average_rating', { ascending: false });
    else if (sortBy === 'popular') query = query.order('reviews_count', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data, count } = await query;
    setDishes(data || []);
    setTotal(count || 0);
    setLoading(false);
  }

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <Layout>
      <Head>
        <title>Yemekler | Filtresiz Gastronomi</title>
        <meta name="description" content="Türkiye'nin en kapsamlı yemek rehberi" />
      </Head>

      {/* Hero */}
      <div style={{ background: 'var(--hero-bg)', padding: '60px 0 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 40, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>Yemekler</h1>
          <p style={{ fontSize: 16, color: 'var(--dim)', margin: 0 }}>{total} yemek keşfedilmeyi bekliyor</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ borderBottom: `1px solid ${'var(--border)'}`, background: 'var(--filter-bg)', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 12, alignItems: 'center', height: 56, flexWrap: 'wrap' }}>
          <input type="text" placeholder="Yemek ara..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: 200, background: 'var(--input-bg)', border: `1px solid ${'var(--border)'}`, borderRadius: 6, padding: '8px 14px', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
            style={{ background: 'var(--input-bg)', border: `1px solid ${'var(--border)'}`, borderRadius: 6, padding: '8px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="">Tüm Kategoriler</option>
            {Object.entries(DISH_CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
            style={{ background: 'var(--input-bg)', border: `1px solid ${'var(--border)'}`, borderRadius: 6, padding: '8px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="created_at">En Yeni</option>
            <option value="rating">En Yüksek Puan</option>
            <option value="popular">En Popüler</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{ height: 320, borderRadius: 12, background: 'var(--card)', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : dishes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🍽</div>
            <div style={{ fontSize: 16 }}>Sonuç bulunamadı</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {dishes.map(dish => <DishCard key={dish.id} dish={dish} onClick={() => router.push(`/dish/${dish.slug}`)} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48 }}>
            <PageBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</PageBtn>
            {[...Array(Math.min(totalPages, 7))].map((_, i) => (
              <PageBtn key={i} onClick={() => setPage(i + 1)} active={page === i + 1}>{i + 1}</PageBtn>
            ))}
            <PageBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</PageBtn>
          </div>
        )}
      </div>
    </Layout>
  );
}

function DishCard({ dish, onClick }) {
  return (
    <div onClick={onClick} style={{ cursor: 'pointer', background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 12, overflow: 'hidden', transition: 'transform 0.2s, border-color 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(232,0,13,0.4)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
      <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
        {dish.image_url
          ? <img src={dish.image_url} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
          : <div style={{ width: '100%', height: '100%', background: 'rgba(232,0,13,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🍽</div>}
        {dish.category && (
          <div style={{ position: 'absolute', top: 12, left: 12, background: 'var(--overlay-bg)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: 20, fontSize: 11, color: 'var(--text)' }}>
            {DISH_CATEGORIES[dish.category] || dish.category}
          </div>
        )}
      </div>
      <div style={{ padding: 20 }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700 }}>{dish.name}</h3>
        {dish.cities?.name && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>📍 {dish.cities.name}</div>}
        {dish.short_description && (
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--dim)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {dish.short_description}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {dish.average_rating > 0
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#f59e0b' }}>★</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{Number(dish.average_rating).toFixed(1)}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>({dish.reviews_count})</span>
              </div>
            : <span style={{ fontSize: 12, color: 'var(--muted)' }}>Henüz değerlendirme yok</span>}
          <span style={{ fontSize: 12, color: 'var(--dim)' }}>Detay →</span>
        </div>
      </div>
    </div>
  );
}

function PageBtn({ children, onClick, disabled, active }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: 36, height: 36, borderRadius: 6, border: `1px solid ${active ? 'var(--red)' : 'var(--border)'}`, background: active ? 'var(--red)' : 'transparent', color: active ? 'var(--text)' : disabled ? 'var(--muted)' : 'var(--dim)', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13 }}>
      {children}
    </button>
  );
}
