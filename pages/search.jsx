import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/constants';

const TABS = [
  { key: 'all',         label: 'Tümü',        icon: '🔍' },
  { key: 'dishes',      label: 'Yemekler',    icon: '🍽' },
  { key: 'restaurants', label: 'Restoranlar', icon: '🏪' },
  { key: 'chefs',       label: 'Şefler',      icon: '👨‍🍳' },
  { key: 'cities',      label: 'Şehirler',    icon: '🗺' },
  { key: 'articles',    label: 'Makaleler',   icon: '📰' },
];

const TYPE_META = {
  dish:       { label: 'Yemek',      color: '#f59e0b', icon: '🍽' },
  restaurant: { label: 'Restoran',   color: '#10b981', icon: '🏪' },
  chef:       { label: 'Şef',        color: '#8b5cf6', icon: '👨‍🍳' },
  city:       { label: 'Şehir',      color: COLORS.red, icon: '🗺' },
  article:    { label: 'Makale',     color: '#3b82f6', icon: '📰' },
};

export default function SearchPage() {
  const router = useRouter();
  const { q } = router.query;
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState({ dishes: [], restaurants: [], chefs: [], cities: [], articles: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState('');
  const inputRef = useRef();
  const debounceRef = useRef();

  useEffect(() => {
    if (q) { setQuery(q); doSearch(q); }
  }, [q]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  async function doSearch(term) {
    if (!term || term.trim().length < 2) return;
    setLoading(true);
    setSearched(term.trim());

    const t = term.trim();
    const like = `%${t}%`;
    // FTS sorgusu — kelimeyi prefix ile ara (örn: "kebap" → "kebap:*")

    const [dishes, restaurants, chefs, cities, articles] = await Promise.all([
      supabase.from('dishes')
        .select('id, name, slug, cover_image_url, short_description, cities(name)')
        .eq('status', 'published')
        .ilike('name', like)
        .limit(8),
      supabase.from('restaurants')
        .select('id, name, slug, image_url, short_description, cuisine_type, cities(name)')
        .eq('status', 'published')
        .ilike('name', like)
        .limit(8),
      supabase.from('chefs')
        .select('id, name, slug, image_url, title, cities(name)')
        .eq('status', 'published')
        .ilike('name', like)
        .limit(8),
      supabase.from('cities')
        .select('id, name, slug, image_url, short_description')
        .eq('is_active', true)
        .ilike('name', like)
        .limit(6),
      supabase.from('articles')
        .select('id, title, slug, cover_image_url, excerpt, category, published_at')
        .eq('status', 'published')
        .ilike('title', like)
        .limit(8),
    ]);

    setResults({
      dishes:      dishes.data      || [],
      restaurants: restaurants.data || [],
      chefs:       chefs.data       || [],
      cities:      cities.data      || [],
      articles:    articles.data    || [],
    });
    setLoading(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`, undefined, { shallow: true });
    doSearch(query.trim());
  }

  // Debounced live search
  function handleInputChange(val) {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        router.push(`/search?q=${encodeURIComponent(val.trim())}`, undefined, { shallow: true });
        doSearch(val.trim());
      }, 400);
    }
  }

  const totalResults = Object.values(results).reduce((a, b) => a + b.length, 0);

  const filtered = activeTab === 'all'
    ? [
        ...results.dishes.map(d => ({ ...d, _type: 'dish', _img: d.cover_image_url, _name: d.name, _sub: d.cities?.name || d.cuisine_type, _desc: d.short_description })),
        ...results.restaurants.map(r => ({ ...r, _type: 'restaurant', _img: r.image_url, _name: r.name, _sub: r.cities?.name || r.cuisine_type, _desc: r.short_description })),
        ...results.chefs.map(c => ({ ...c, _type: 'chef', _img: c.image_url, _name: c.name, _sub: c.cities?.name || c.title, _desc: c.title })),
        ...results.cities.map(c => ({ ...c, _type: 'city', _img: c.image_url, _name: c.name, _sub: null, _desc: c.short_description })),
        ...results.articles.map(a => ({ ...a, _type: 'article', _img: a.cover_image_url, _name: a.title, _sub: a.category, _desc: a.excerpt })),
      ]
    : (results[activeTab] || []).map(item => {
        if (activeTab === 'dishes')      return { ...item, _type: 'dish',       _img: item.cover_image_url, _name: item.name,  _sub: item.cities?.name || item.cuisine_type, _desc: item.short_description };
        if (activeTab === 'restaurants') return { ...item, _type: 'restaurant', _img: item.image_url,       _name: item.name,  _sub: item.cities?.name || item.cuisine_type, _desc: item.short_description };
        if (activeTab === 'chefs')       return { ...item, _type: 'chef',       _img: item.image_url,       _name: item.name,  _sub: item.cities?.name,                      _desc: item.title };
        if (activeTab === 'cities')      return { ...item, _type: 'city',       _img: item.image_url,       _name: item.name,  _sub: null,                                   _desc: item.short_description };
        if (activeTab === 'articles')    return { ...item, _type: 'article',    _img: item.cover_image_url, _name: item.title, _sub: item.category,                          _desc: item.excerpt };
        return item;
      });

  function getHref(item) {
    const t = item._type;
    if (t === 'dish')       return `/dish/${item.slug}`;
    if (t === 'restaurant') return `/restaurant/${item.slug}`;
    if (t === 'chef')       return `/chef/${item.slug}`;
    if (t === 'city')       return `/city/${item.slug}`;
    if (t === 'article')    return `/article/${item.slug}`;
  }

  return (
    <Layout>
      <Head>
        <title>{searched ? `"${searched}" araması | Filtresiz Gastronomi` : 'Arama | Filtresiz Gastronomi'}</title>
      </Head>

      {/* Arama Hero */}
      <div style={{ background: 'linear-gradient(180deg, #1a0000 0%, #0d0d0d 100%)', padding: '72px 0 40px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.02em' }}>🔍 Ara</h1>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: COLORS.muted }}>Yemek, restoran, şef, şehir veya makale ara</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10 }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => handleInputChange(e.target.value)}
              placeholder="Örn: Lahmacun, Gaziantep, Kebap..."
              style={{
                flex: 1, background: 'rgba(255,255,255,0.08)',
                border: `1px solid ${query.length >= 2 ? 'rgba(232,0,13,0.4)' : COLORS.border}`,
                borderRadius: 8, padding: '14px 20px', color: COLORS.white, fontSize: 16, outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            <button type="submit"
              style={{ background: COLORS.red, border: 'none', color: COLORS.white, padding: '14px 28px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>
              Ara
            </button>
          </form>

          {/* Popüler aramalar (aramadan önce) */}
          {!searched && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: COLORS.muted, alignSelf: 'center' }}>Popüler:</span>
              {['Lahmacun', 'Kebap', 'İstanbul', 'Baklava', 'Pide', 'Gaziantep'].map(term => (
                <span key={term} onClick={() => { setQuery(term); router.push(`/search?q=${encodeURIComponent(term)}`); doSearch(term); }}
                  style={{ fontSize: 12, padding: '4px 12px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 20, color: COLORS.dim, cursor: 'pointer' }}>
                  {term}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sonuçlar */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div style={{ color: COLORS.muted, fontSize: 14 }}>Aranıyor...</div>
          </div>
        ) : searched && totalResults === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤷</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>"{searched}" için sonuç bulunamadı</h3>
            <p style={{ color: COLORS.muted, fontSize: 14 }}>Farklı kelimeler deneyin veya daha kısa yazın.</p>
            <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Kebap', 'İstanbul', 'Baklava'].map(term => (
                <span key={term} onClick={() => { setQuery(term); router.push(`/search?q=${encodeURIComponent(term)}`); doSearch(term); }}
                  style={{ fontSize: 13, padding: '6px 16px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 20, color: COLORS.dim, cursor: 'pointer' }}>
                  {term}
                </span>
              ))}
            </div>
          </div>
        ) : searched && totalResults > 0 ? (
          <>
            {/* Sonuç özeti */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span style={{ fontSize: 14, color: COLORS.muted }}>"{searched}" için </span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{totalResults} sonuç</span>
                <span style={{ fontSize: 14, color: COLORS.muted }}> bulundu</span>
              </div>
            </div>

            {/* Sekmeler */}
            <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 32, overflowX: 'auto' }}>
              {TABS.filter(tab => tab.key === 'all' || results[tab.key]?.length > 0).map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  style={{
                    background: 'transparent', border: 'none', whiteSpace: 'nowrap',
                    color: activeTab === tab.key ? COLORS.white : COLORS.dim,
                    padding: '10px 18px', fontSize: 13, cursor: 'pointer',
                    fontWeight: activeTab === tab.key ? 700 : 400,
                    borderBottom: activeTab === tab.key ? `2px solid ${COLORS.red}` : '2px solid transparent',
                    marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                  <span>{tab.icon}</span>
                  {tab.label}
                  {tab.key !== 'all' && results[tab.key]?.length > 0 && (
                    <span style={{ fontSize: 11, background: activeTab === tab.key ? COLORS.red : 'rgba(255,255,255,0.1)', color: COLORS.white, padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                      {results[tab.key].length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Sonuç Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {filtered.map((item, idx) => {
                const meta = TYPE_META[item._type];
                const href = getHref(item);
                return (
                  <div key={`${item._type}-${item.id}`} onClick={() => router.push(href)}
                    style={{ cursor: 'pointer', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: 'hidden', transition: 'transform 0.15s, border-color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(232,0,13,0.35)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = COLORS.border; }}>

                    {/* Görsel */}
                    <div style={{ height: 150, overflow: 'hidden', position: 'relative', background: `${meta.color}12` }}>
                      {item._img
                        ? <img src={item._img} alt={item._name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>{meta.icon}</div>}
                      <span style={{ position: 'absolute', top: 10, left: 10, background: `${meta.color}dd`, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                        {meta.icon} {meta.label}
                      </span>
                    </div>

                    {/* Bilgi */}
                    <div style={{ padding: '12px 14px' }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{item._name}</h4>
                      {item._sub && <div style={{ fontSize: 11, color: meta.color, marginBottom: 6, fontWeight: 600 }}>{item._sub}</div>}
                      {item._desc && (
                        <p style={{ margin: 0, fontSize: 12, color: COLORS.dim, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item._desc}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          // Henüz arama yapılmadı
          <div style={{ textAlign: 'center', padding: '60px 0', color: COLORS.muted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🍽</div>
            <p style={{ fontSize: 15 }}>Türkiye'nin gastronomi haritasında bir şeyler ara...</p>
          </div>
        )}
      </div>
    </Layout>
  );
}