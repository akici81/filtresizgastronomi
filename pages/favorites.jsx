import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
const TABS = [
  { key: 'all',         label: 'Tümü',       icon: '♥' },
  { key: 'dishes',      label: 'Yemekler',   icon: '🍽' },
  { key: 'restaurants', label: 'Restoranlar', icon: '🏪' },
  { key: 'chefs',       label: 'Şefler',     icon: '👨‍🍳' },
  { key: 'articles',    label: 'Makaleler',  icon: '📰' },
];

export default function FavorilerPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login?redirect=/favorilerim'); return; }
    fetchFavorites();
  }, [user, authLoading]);

  async function fetchFavorites() {
    setLoading(true);
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id, collection_name, note, created_at,
        dishes(id, name, slug, cover_image_url, rating_avg, cuisine_type),
        restaurants(id, name, slug, image_url, rating_avg, cuisine_type),
        chefs(id, name, slug, image_url, title),
        articles(id, title, slug, cover_image_url, published_at, excerpt)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setFavorites(data || []);
    setLoading(false);
  }

  async function removeFavorite(favId) {
    setRemoving(favId);
    const { error } = await supabase.from('favorites').delete().eq('id', favId).eq('user_id', user.id);
    if (!error) setFavorites(prev => prev.filter(f => f.id !== favId));
    setRemoving(null);
  }

  if (authLoading) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '120px 24px', color: 'var(--muted)' }}>Yükleniyor...</div>
    </Layout>
  );

  // Sekmeye göre filtrele
  const filtered = favorites.filter(fav => {
    if (activeTab === 'all') return true;
    if (activeTab === 'dishes') return !!fav.dishes;
    if (activeTab === 'restaurants') return !!fav.restaurants;
    if (activeTab === 'chefs') return !!fav.chefs;
    if (activeTab === 'articles') return !!fav.articles;
    return true;
  });

  // Sekme sayıları
  const counts = {
    all: favorites.length,
    dishes: favorites.filter(f => f.dishes).length,
    restaurants: favorites.filter(f => f.restaurants).length,
    chefs: favorites.filter(f => f.chefs).length,
    articles: favorites.filter(f => f.articles).length,
  };

  return (
    <Layout>
      <Head>
        <title>Favorilerim | Filtresiz Gastronomi</title>
      </Head>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px' }}>
        {/* Başlık */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 900, fontFamily: "'Georgia', serif" }}>
            ♥ Favorilerim
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
            {favorites.length} kayıtlı içerik
          </p>
        </div>

        {/* Sekmeler */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${'var(--border)'}`, marginBottom: 32, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: 'transparent', border: 'none', whiteSpace: 'nowrap',
                color: activeTab === tab.key ? 'var(--text)' : 'var(--dim)',
                padding: '12px 20px', fontSize: 13,
                fontWeight: activeTab === tab.key ? 700 : 400,
                cursor: 'pointer',
                borderBottom: activeTab === tab.key ? `2px solid ${'var(--red)'}` : '2px solid transparent',
                marginBottom: -1, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {counts[tab.key] > 0 && (
                <span style={{ fontSize: 11, background: activeTab === tab.key ? 'var(--red)' : 'var(--tab-inactive)', color: 'var(--text)', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* İçerik */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {activeTab === 'dishes' ? '🍽' : activeTab === 'restaurants' ? '🏪' : activeTab === 'chefs' ? '👨‍🍳' : activeTab === 'articles' ? '📰' : '♥'}
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>
              {activeTab === 'all' ? 'Henüz favori eklemediniz' : 'Bu kategoride favori yok'}
            </h3>
            <p style={{ margin: '0 0 24px', color: 'var(--muted)', fontSize: 14 }}>
              Beğendiğin içerikleri favorilere ekleyerek burada toplayabilirsin.
            </p>
            <button
              onClick={() => router.push(activeTab === 'dishes' ? '/dishes' : activeTab === 'restaurants' ? '/restaurants' : activeTab === 'chefs' ? '/chefs' : activeTab === 'articles' ? '/articles' : '/')}
              style={{ background: 'var(--red)', border: 'none', color: 'var(--text)', padding: '10px 24px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
            >
              Keşfet
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {filtered.map(fav => {
              const item = fav.dishes || fav.restaurants || fav.chefs || fav.articles;
              if (!item) return null;

              const type = fav.dishes ? 'dish' : fav.restaurants ? 'restaurant' : fav.chefs ? 'chef' : 'article';
              const href = `/${type === 'dish' ? 'dish' : type === 'restaurant' ? 'restaurant' : type === 'chef' ? 'chef' : 'article'}/${item.slug}`;
              const img = fav.dishes?.cover_image_url || fav.restaurants?.image_url || fav.chefs?.image_url || fav.articles?.cover_image_url;
              const title = fav.dishes?.name || fav.restaurants?.name || fav.chefs?.name || fav.articles?.title;
              const subtitle = fav.dishes?.cuisine_type || fav.restaurants?.cuisine_type || fav.chefs?.title || (fav.articles?.published_at ? new Date(fav.articles.published_at).toLocaleDateString('tr-TR') : '');
              const rating = fav.dishes?.rating_avg || fav.restaurants?.rating_avg;
              const typeIcon = type === 'dish' ? '🍽' : type === 'restaurant' ? '🏪' : type === 'chef' ? '👨‍🍳' : '📰';

              return (
                <div
                  key={fav.id}
                  style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 10, overflow: 'hidden', position: 'relative', transition: 'transform 0.15s, border-color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  {/* Görsel */}
                  <div
                    onClick={() => router.push(href)}
                    style={{ cursor: 'pointer', position: 'relative', height: 160, overflow: 'hidden' }}
                  >
                    {img ? (
                      <img src={img} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'var(--subtle-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                        {typeIcon}
                      </div>
                    )}
                    {/* Tip badge */}
                    <div style={{ position: 'absolute', top: 10, left: 10, background: 'var(--overlay-bg)', backdropFilter: 'blur(4px)', padding: '3px 8px', borderRadius: 4, fontSize: 11, color: 'var(--dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>{typeIcon}</span>
                      <span>{type === 'dish' ? 'Yemek' : type === 'restaurant' ? 'Restoran' : type === 'chef' ? 'Şef' : 'Makale'}</span>
                    </div>
                    {/* Rating */}
                    {rating > 0 && (
                      <div style={{ position: 'absolute', top: 10, right: 10, background: 'var(--overlay-bg)', backdropFilter: 'blur(4px)', padding: '3px 8px', borderRadius: 4, fontSize: 12, color: '#f59e0b', fontWeight: 700 }}>
                        ★ {rating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Bilgi */}
                  <div style={{ padding: '12px 14px 14px' }}>
                    <h3
                      onClick={() => router.push(href)}
                      style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, lineHeight: 1.4, cursor: 'pointer', color: 'var(--text)' }}
                    >
                      {title}
                    </h3>
                    {subtitle && (
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--muted)' }}>{subtitle}</p>
                    )}
                    {fav.collection_name && (
                      <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>📁</span> {fav.collection_name}
                      </div>
                    )}
                    {fav.note && (
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--dim)', fontStyle: 'italic', lineHeight: 1.5 }}>"{fav.note}"</p>
                    )}

                    {/* Alt Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {new Date(fav.created_at).toLocaleDateString('tr-TR')}
                      </span>
                      <button
                        onClick={() => removeFavorite(fav.id)}
                        disabled={removing === fav.id}
                        style={{ background: 'transparent', border: `1px solid rgba(239,68,68,0.3)`, color: '#ef4444', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11, opacity: removing === fav.id ? 0.5 : 1 }}
                      >
                        {removing === fav.id ? '...' : '♥ Çıkar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}