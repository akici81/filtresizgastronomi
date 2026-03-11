import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { supabase } from '../../lib/supabase';
import { COLORS, DISH_CATEGORIES } from '../../lib/constants';

export default function CityDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const [city, setCity] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [activeTab, setActiveTab] = useState('dishes');
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (slug) fetchCity(); }, [slug]);

  async function fetchCity() {
    setLoading(true);
    const { data } = await supabase.from('cities').select('*').eq('slug', slug).eq('is_active', true).single();
    setCity(data);
    if (data) {
      const [dishRes, restRes] = await Promise.all([
        supabase.from('dishes').select('id, name, slug, image_url, short_description, average_rating, reviews_count, category').eq('city_id', data.id).eq('status', 'published').order('average_rating', { ascending: false }),
        supabase.from('restaurants').select('id, name, slug, image_url, short_description, average_rating, reviews_count, cuisine_type, price_range').eq('city_id', data.id).eq('status', 'published').order('average_rating', { ascending: false }),
      ]);
      setDishes(dishRes.data || []);
      setRestaurants(restRes.data || []);
    }
    setLoading(false);
  }

  if (loading) return <Layout><div style={{ textAlign: 'center', padding: '120px 24px', color: 'var(--muted)' }}>Yükleniyor...</div></Layout>;
  if (!city) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '120px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗺</div>
        <h2>Şehir bulunamadı</h2>
        <button onClick={() => router.push('/cities')} style={{ marginTop: 16, background: 'var(--red)', border: 'none', color: 'var(--text)', padding: '10px 24px', borderRadius: 6, cursor: 'pointer' }}>Tüm Şehirler</button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <Head>
        <title>{city.seo_title || `${city.name} Gastronomisi | Filtresiz Gastronomi`}</title>
        <meta name="description" content={city.seo_description || city.short_description || ''} />
      </Head>

      {/* Hero */}
      <div style={{ position: 'relative', height: 500, overflow: 'hidden' }}>
        {city.cover_image_url || city.image_url
          ? <img src={city.cover_image_url || city.image_url} alt={city.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'var(--hero-bg)' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 48px 48px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h1 style={{ fontSize: 56, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.03em' }}>{city.name}</h1>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', margin: '0 0 20px', maxWidth: 600 }}>{city.short_description}</p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {city.dishes_count > 0 && <Stat value={city.dishes_count} label="Yemek" />}
              {city.restaurants_count > 0 && <Stat value={city.restaurants_count} label="Restoran" />}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {city.description && (
          <div style={{ padding: '48px 0', borderBottom: `1px solid ${'var(--border)'}` }}>
            <div style={{ maxWidth: 800, fontSize: 16, color: 'var(--dim)', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: city.description }} />
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${'var(--border)'}`, marginTop: 16 }}>
          {[
            { key: 'dishes', label: `Yemekler (${dishes.length})` },
            { key: 'restaurants', label: `Restoranlar (${restaurants.length})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ background: 'transparent', border: 'none', color: activeTab === tab.key ? 'var(--text)' : 'var(--dim)', padding: '14px 20px', fontSize: 14, cursor: 'pointer', borderBottom: activeTab === tab.key ? `2px solid ${'var(--red)'}` : '2px solid transparent', marginBottom: -1, transition: 'all 0.15s' }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '32px 0 64px' }}>
          {activeTab === 'dishes' && (
            dishes.length === 0
              ? <EmptyState icon="🍽" text="Bu şehre ait yemek bulunamadı" />
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                  {dishes.map(dish => (
                    <MiniCard key={dish.id} item={dish} badge={DISH_CATEGORIES[dish.category]} onClick={() => router.push(`/dish/${dish.slug}`)} />
                  ))}
                </div>
          )}
          {activeTab === 'restaurants' && (
            restaurants.length === 0
              ? <EmptyState icon="🏪" text="Bu şehre ait restoran bulunamadı" />
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                  {restaurants.map(r => (
                    <MiniCard key={r.id} item={r} badge={r.cuisine_type} onClick={() => router.push(`/restaurant/${r.slug}`)} />
                  ))}
                </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--red)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>{label.toUpperCase()}</div>
    </div>
  );
}

function MiniCard({ item, badge, onClick }) {
  return (
    <div onClick={onClick} style={{ cursor: 'pointer', background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 10, overflow: 'hidden', transition: 'transform 0.2s, border-color 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(232,0,13,0.4)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
      <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
        {item.image_url
          ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'rgba(232,0,13,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🍽</div>}
        {badge && <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: '3px 8px', borderRadius: 20, fontSize: 10, color: 'var(--text)' }}>{badge}</div>}
      </div>
      <div style={{ padding: 16 }}>
        <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{item.name}</h4>
        {item.short_description && <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--dim)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.short_description}</p>}
        {item.average_rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#f59e0b', fontSize: 12 }}>★</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{Number(item.average_rating).toFixed(1)}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>({item.reviews_count})</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div>{text}</div>
    </div>
  );
}
