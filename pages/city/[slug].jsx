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
  const [giDishes, setGiDishes] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [activeTab, setActiveTab] = useState('gi');
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (slug) fetchCity(); }, [slug]);

  async function fetchCity() {
    setLoading(true);
    const { data } = await supabase.from('cities').select('*').eq('slug', slug).eq('is_active', true).single();
    setCity(data);
    if (data) {
      const [dishRes, restRes] = await Promise.all([
        supabase.from('dishes').select('id, name, slug, image_url, short_description, average_rating, reviews_count, category, gi_status, gi_tur, gi_number').eq('city_id', data.id).eq('status', 'published').order('average_rating', { ascending: false }),
        supabase.from('restaurants').select('id, name, slug, image_url, short_description, average_rating, reviews_count, cuisine_type, price_range').eq('city_id', data.id).eq('status', 'published').order('average_rating', { ascending: false }),
      ]);
      const allDishes = dishRes.data || [];
      setDishes(allDishes.filter(d => !d.gi_status));
      setGiDishes(allDishes.filter(d => d.gi_status));
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
        {/* Görsel veya gradient arkaplan */}
        {city.cover_image_url || city.image_url
          ? <img src={city.cover_image_url || city.image_url} alt={city.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (
            <div style={{
              width: '100%', height: '100%',
              background: `
                radial-gradient(ellipse at 20% 50%, rgba(232,0,13,0.25) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 20%, rgba(232,0,13,0.12) 0%, transparent 50%),
                linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)
              `,
            }}>
              {/* Dekoratif büyük harf */}
              <div style={{
                position: 'absolute', right: '8%', top: '50%', transform: 'translateY(-50%)',
                fontSize: 'clamp(120px, 18vw, 240px)', fontWeight: 900,
                color: 'rgba(232,0,13,0.06)', letterSpacing: '-0.05em',
                lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
              }}>
                {city.name[0]}
              </div>
            </div>
          )
        }
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.1) 100%)' }} />

        {/* İçerik */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 48px 48px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {city.region && (
              <div style={{ fontSize: 12, letterSpacing: '0.12em', color: 'rgba(232,0,13,0.8)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase' }}>
                {city.region}
              </div>
            )}
            <h1 style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.03em', color: 'white' }}>
              {city.name}
            </h1>
            {city.short_description && (
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', margin: '0 0 24px', maxWidth: 560, lineHeight: 1.6 }}>
                {city.short_description}
              </p>
            )}
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {giDishes.length > 0 && <Stat value={giDishes.length} label="Coğrafi İşaret" color="#f59e0b" />}
              {dishes.length > 0 && <Stat value={dishes.length} label="Yöresel Yemek" color="var(--red)" />}
              {city.restaurants_count > 0 && <Stat value={city.restaurants_count} label="Restoran" color="rgba(255,255,255,0.7)" />}
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
            { key: 'gi', label: `🏅 Coğrafi İşaretler (${giDishes.length})` },
            { key: 'dishes', label: `🍽 Yöresel Yemekler (${dishes.length})` },
            { key: 'restaurants', label: `🏪 Restoranlar (${restaurants.length})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ background: 'transparent', border: 'none', color: activeTab === tab.key ? 'var(--text)' : 'var(--dim)', padding: '14px 20px', fontSize: 14, cursor: 'pointer', borderBottom: activeTab === tab.key ? `2px solid ${'var(--red)'}` : '2px solid transparent', marginBottom: -1, transition: 'all 0.15s' }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '32px 0 64px' }}>
          {/* Coğrafi İşaretler */}
          {activeTab === 'gi' && (
            giDishes.length === 0
              ? <EmptyState icon="🏅" text="Bu şehre ait coğrafi işaretli ürün bulunamadı" />
              : (
                <>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
                    {['Menşe Adı', 'Mahreç İşareti', 'Geleneksel Ürün Adı'].map(tur => {
                      const count = giDishes.filter(d => d.gi_tur === tur).length;
                      if (!count) return null;
                      const color = tur === 'Menşe Adı' ? '#3b82f6' : tur === 'Geleneksel Ürün Adı' ? '#10b981' : '#f59e0b';
                      const bg = tur === 'Menşe Adı' ? 'rgba(59,130,246,0.08)' : tur === 'Geleneksel Ürün Adı' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)';
                      const muhur = tur === 'Menşe Adı'
                        ? 'https://ci.turkpatent.gov.tr/uploads/images/mense_adi.png'
                        : tur === 'Geleneksel Ürün Adı'
                        ? 'https://ci.turkpatent.gov.tr/uploads/images/geleneksel_urun.png'
                        : 'https://ci.turkpatent.gov.tr/uploads/images/mahrec_isareti.png';
                      return (
                        <div key={tur} style={{ display: 'flex', alignItems: 'center', gap: 10, background: bg, border: `1px solid ${color}30`, borderRadius: 10, padding: '10px 16px' }}>
                          <img src={muhur} alt={tur} style={{ width: 36, height: 36, objectFit: 'contain' }} />
                          <div>
                            <div style={{ fontSize: 11, color, fontWeight: 600 }}>{tur}</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1.1 }}>{count}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                    {giDishes.map(dish => (
                      <GICard key={dish.id} dish={dish} onClick={() => router.push(`/dish/${dish.slug}`)} />
                    ))}
                  </div>
                </>
              )
          )}

          {/* Yöresel Yemekler */}
          {activeTab === 'dishes' && (
            dishes.length === 0
              ? <EmptyState icon="🍽" text="Bu şehre ait yöresel yemek henüz eklenmedi" />
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                  {dishes.map(dish => (
                    <MiniCard key={dish.id} item={dish} badge={DISH_CATEGORIES[dish.category]} onClick={() => router.push(`/dish/${dish.slug}`)} />
                  ))}
                </div>
          )}

          {/* Restoranlar */}
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

function Stat({ value, label, color }) {
  return (
    <div>
      <div style={{ fontSize: 28, fontWeight: 900, color: color || 'var(--red)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>{label.toUpperCase()}</div>
    </div>
  );
}

function GICard({ dish, onClick }) {
  const color = dish.gi_tur === 'Menşe Adı' ? '#3b82f6' : dish.gi_tur === 'Geleneksel Ürün Adı' ? '#10b981' : '#f59e0b';
  const bg = dish.gi_tur === 'Menşe Adı' ? 'rgba(59,130,246,0.06)' : dish.gi_tur === 'Geleneksel Ürün Adı' ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)';
  const muhur = dish.gi_tur === 'Menşe Adı'
    ? 'https://ci.turkpatent.gov.tr/uploads/images/mense_adi.png'
    : dish.gi_tur === 'Geleneksel Ürün Adı'
    ? 'https://ci.turkpatent.gov.tr/uploads/images/geleneksel_urun.png'
    : 'https://ci.turkpatent.gov.tr/uploads/images/mahrec_isareti.png';
  const label = dish.gi_tur === 'Menşe Adı' ? 'Menşe' : dish.gi_tur === 'Geleneksel Ürün Adı' ? 'Geleneksel' : 'Mahreç';

  return (
    <div onClick={onClick}
      style={{ cursor: 'pointer', background: 'var(--card)', border: `1px solid ${color}20`, borderRadius: 10, overflow: 'hidden', transition: 'transform 0.2s, border-color 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = `${color}50`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = `${color}20`; }}>
      <div style={{ height: 160, overflow: 'hidden', position: 'relative', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {dish.image_url
          ? <img src={dish.image_url} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <img src={muhur} alt={dish.gi_tur} style={{ width: 80, height: 80, objectFit: 'contain', opacity: 0.4 }} />
        }
        <div style={{ position: 'absolute', top: 10, left: 10, background: `${color}22`, border: `1px solid ${color}44`, backdropFilter: 'blur(8px)', padding: '3px 10px', borderRadius: 20, fontSize: 10, color, fontWeight: 700 }}>
          {label}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{dish.name}</h4>
        {dish.short_description && (
          <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--dim)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {dish.short_description}
          </p>
        )}
        {dish.gi_number && (
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Tescil No: <span style={{ color, fontWeight: 600 }}>{dish.gi_number}</span>
          </div>
        )}
      </div>
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