import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { COLORS, DISH_CATEGORIES, ARTICLE_CATEGORIES } from '../lib/constants';

const TABS = [
  { key: 'all', label: 'Tümü' },
  { key: 'dishes', label: 'Yemekler' },
  { key: 'restaurants', label: 'Restoranlar' },
  { key: 'chefs', label: 'Şefler' },
  { key: 'cities', label: 'Şehirler' },
  { key: 'articles', label: 'Makaleler' },
];

export default function SearchPage() {
  const router = useRouter();
  const { q } = router.query;
  const [query, setQuery] = useState(q || '');
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState({ dishes: [], restaurants: [], chefs: [], cities: [], articles: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (q) { setQuery(q); search(q); } }, [q]);

  async function search(term) {
    if (!term || term.length < 2) return;
    setLoading(true);
    const like = `%${term}%`;

    const [dishes, restaurants, chefs, cities, articles] = await Promise.all([
      supabase.from('dishes').select('id, name, slug, image_url, short_description, category, cities(name)').eq('status', 'published').ilike('name', like).limit(6),
      supabase.from('restaurants').select('id, name, slug, image_url, short_description, cuisine_type, cities(name)').eq('status', 'published').ilike('name', like).limit(6),
      supabase.from('chefs').select('id, name, slug, image_url, title, cities(name)').eq('status', 'published').ilike('name', like).limit(6),
      supabase.from('cities').select('id, name, slug, image_url, short_description').eq('is_active', true).ilike('name', like).limit(6),
      supabase.from('articles').select('id, title, slug, cover_image_url, excerpt, category').eq('status', 'published').ilike('title', like).limit(6),
    ]);

    setResults({
      dishes: dishes.data || [],
      restaurants: restaurants.data || [],
      chefs: chefs.data || [],
      cities: cities.data || [],
      articles: articles.data || [],
    });
    setLoading(false);
  }

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`, undefined, { shallow: true });
    search(query.trim());
  }

  const totalResults = Object.values(results).reduce((a, b) => a + b.length, 0);

  const filtered = activeTab === 'all'
    ? [...results.dishes.map(d => ({ ...d, _type: 'dish' })),
       ...results.restaurants.map(r => ({ ...r, _type: 'restaurant' })),
       ...results.chefs.map(c => ({ ...c, _type: 'chef' })),
       ...results.cities.map(c => ({ ...c, _type: 'city' })),
       ...results.articles.map(a => ({ ...a, _type: 'article' }))]
    : results[activeTab]?.map(item => ({ ...item, _type: activeTab.slice(0, -1) })) || [];

  return (
    <Layout>
      <Head>
        <title>{q ? `"${q}" araması | Filtresiz Gastronomi` : 'Arama | Filtresiz Gastronomi'}</title>
      </Head>

      <div style={{ background: 'linear-gradient(180deg, #1a0000 0%, #0d0d0d 100%)', padding: '60px 0 40px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 24px' }}>Arama</h1>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Yemek, restoran, şef, şehir ara..."
              autoFocus
              style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '14px 20px', color: COLORS.white, fontSize: 16, outline: 'none' }}
            />
            <button type="submit" style={{ background: COLORS.red, border: 'none', color: COLORS.white, padding: '14px 28px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Ara</button>
          </form>
        </div>
      </div>

      {q && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: COLORS.muted }}>Aranıyor...</div>
          ) : totalResults === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: COLORS.muted }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 16 }}>"{q}" için sonuç bulunamadı</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>Farklı kelimeler deneyin</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 14, color: COLORS.muted }}>"{q}" için </span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{totalResults} sonuç</span>
                <span style={{ fontSize: 14, color: COLORS.muted }}> bulundu</span>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 32, overflowX: 'auto' }}>
                {TABS.filter(tab => tab.key === 'all' || results[tab.key]?.length > 0).map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    style={{ background: 'transparent', border: 'none', color: activeTab === tab.key ? COLORS.white : COLORS.dim, padding: '10px 16px', fontSize: 13, cursor: 'pointer', borderBottom: activeTab === tab.key ? `2px solid ${COLORS.red}` : '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                    {tab.label}
                    {tab.key !== 'all' && results[tab.key]?.length > 0 && <span style={{ marginLeft: 6, fontSize: 11, color: COLORS.muted }}>({results[tab.key].length})</span>}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {filtered.map((item, idx) => {
                  const type = item._type;
                  const href = type === 'dish' ? `/dish/${item.slug}` : type === 'restaurant' ? `/restaurant/${item.slug}` : type === 'chef' ? `/chef/${item.slug}` : type === 'city' ? `/city/${item.slug}` : `/article/${item.slug}`;
                  const typeLabel = { dish: 'Yemek', restaurant: 'Restoran', chef: 'Şef', city: 'Şehir', article: 'Makale' }[type];
                  const typeColor = { dish: '#f59e0b', restaurant: '#10b981', chef: '#8b5cf6', city: COLORS.red, article: '#3b82f6' }[type];
                  const image = item.image_url || item.cover_image_url;
                  const name = item.name || item.title;
                  const desc = item.short_description || item.excerpt || item.title;
                  const sub = item.cities?.name || item.cuisine_type || item.category;

                  return (
                    <div key={`${type}-${item.id}`} onClick={() => router.push(href)}
                      style={{ cursor: 'pointer', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: 'hidden', transition: 'transform 0.2s, border-color 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(232,0,13,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = COLORS.border; }}>
                      <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
                        {image ? <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: `${typeColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🔍</div>}
                        <span style={{ position: 'absolute', top: 10, left: 10, background: `${typeColor}cc`, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{typeLabel}</span>
                      </div>
                      <div style={{ padding: 16 }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>{name}</h4>
                        {sub && <div style={{ fontSize: 11, color: typeColor, marginBottom: 6 }}>{sub}</div>}
                        {desc && <p style={{ margin: 0, fontSize: 12, color: COLORS.dim, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{desc}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </Layout>
  );
}
