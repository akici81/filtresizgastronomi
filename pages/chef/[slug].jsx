import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../lib/constants';

export default function ChefDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { user } = useAuth();
  const [chef, setChef] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => { if (slug) fetchChef(); }, [slug]);
  useEffect(() => { if (chef && user) checkFavorite(); }, [chef, user]);

  async function fetchChef() {
    setLoading(true);
    const { data } = await supabase.from('chefs').select('*, cities(name, slug)').eq('slug', slug).eq('status', 'published').single();
    setChef(data);
    if (data) {
      const { data: rData } = await supabase
        .from('restaurant_chefs')
        .select('restaurants(id, name, slug, image_url, cuisine_type, average_rating)')
        .eq('chef_id', data.id);
      setRestaurants(rData?.map(r => r.restaurants).filter(Boolean) || []);
    }
    setLoading(false);
  }

  async function checkFavorite() {
    const { data } = await supabase.from('favorites').select('id').eq('user_id', user.id).eq('entity_type', 'chef').eq('entity_id', chef.id).single();
    setIsFavorited(!!data);
  }

  async function toggleFavorite() {
    if (!user) { router.push('/login'); return; }
    if (isFavorited) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('entity_type', 'chef').eq('entity_id', chef.id);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, entity_type: 'chef', entity_id: chef.id });
    }
    setIsFavorited(!isFavorited);
  }

  if (loading) return <Layout><div style={{ textAlign: 'center', padding: '120px 24px', color: COLORS.muted }}>Yükleniyor...</div></Layout>;
  if (!chef) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '120px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍🍳</div>
        <h2>Şef bulunamadı</h2>
        <button onClick={() => router.push('/chefs')} style={{ marginTop: 16, background: COLORS.red, border: 'none', color: COLORS.white, padding: '10px 24px', borderRadius: 6, cursor: 'pointer' }}>Tüm Şefler</button>
      </div>
    </Layout>
  );

  const specialties = Array.isArray(chef.specialties) ? chef.specialties : [];

  return (
    <Layout>
      <Head>
        <title>{chef.seo_title || `${chef.name} | Filtresiz Gastronomi`}</title>
        <meta name="description" content={chef.seo_description || chef.short_bio || ''} />
      </Head>

      {/* Hero */}
      <div style={{ position: 'relative', height: 420, overflow: 'hidden' }}>
        {chef.cover_image_url
          ? <img src={chef.cover_image_url} alt={chef.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a0000, #0d0d0d)' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)' }} />
        <button onClick={toggleFavorite} style={{ position: 'absolute', top: 24, right: 24, background: isFavorited ? COLORS.red : 'rgba(0,0,0,0.6)', border: `1px solid ${isFavorited ? COLORS.red : 'rgba(255,255,255,0.2)'}`, backdropFilter: 'blur(8px)', color: COLORS.white, width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isFavorited ? '♥' : '♡'}
        </button>
      </div>

      {/* Profile Section */}
      <div style={{ maxWidth: 900, margin: '-80px auto 0', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end', marginBottom: 48 }}>
          <div style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', border: `4px solid ${COLORS.bg}`, flexShrink: 0 }}>
            {chef.image_url
              ? <img src={chef.image_url} alt={chef.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: COLORS.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 700 }}>{chef.name[0]}</div>}
          </div>
          <div style={{ paddingBottom: 8 }}>
            <h1 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 6px' }}>{chef.name}</h1>
            {chef.title && <div style={{ fontSize: 15, color: COLORS.red, marginBottom: 8 }}>{chef.title}</div>}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {chef.cities?.name && <span style={{ fontSize: 13, color: COLORS.dim }}>📍 {chef.cities.name}</span>}
              {chef.experience_years && <span style={{ fontSize: 13, color: COLORS.dim }}>⏱ {chef.experience_years} yıl deneyim</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 48 }}>
          {/* Sol */}
          <div>
            {chef.short_bio && <p style={{ fontSize: 17, color: COLORS.dim, lineHeight: 1.7, marginBottom: 40, paddingBottom: 40, borderBottom: `1px solid ${COLORS.border}` }}>{chef.short_bio}</p>}
            {chef.bio && (
              <div style={{ marginBottom: 40, paddingBottom: 40, borderBottom: `1px solid ${COLORS.border}` }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Biyografi</h2>
                <div style={{ fontSize: 15, color: COLORS.dim, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: chef.bio }} />
              </div>
            )}
            {chef.education && (
              <div style={{ marginBottom: 40, paddingBottom: 40, borderBottom: `1px solid ${COLORS.border}` }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Eğitim</h2>
                <div style={{ fontSize: 15, color: COLORS.dim, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: chef.education }} />
              </div>
            )}
            {restaurants.length > 0 && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Restoranlar</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {restaurants.map(r => (
                    <div key={r.id} onClick={() => router.push(`/restaurant/${r.slug}`)} style={{ display: 'flex', gap: 16, padding: 16, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, cursor: 'pointer', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(232,0,13,0.4)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}>
                      <div style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                        {r.image_url ? <img src={r.image_url} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'rgba(232,0,13,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏪</div>}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{r.name}</div>
                        {r.cuisine_type && <div style={{ fontSize: 12, color: COLORS.dim }}>{r.cuisine_type}</div>}
                        {r.average_rating > 0 && <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>★ {Number(r.average_rating).toFixed(1)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sağ Sidebar */}
          <div>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Bilgiler</h3>
              {[
                chef.cities?.name && { label: 'Şehir', value: chef.cities.name },
                chef.experience_years && { label: 'Deneyim', value: `${chef.experience_years} yıl` },
                chef.website && { label: 'Website', value: chef.website },
              ].filter(Boolean).map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: 12, color: COLORS.muted }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>
            {specialties.length > 0 && (
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Uzmanlıklar</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {specialties.map(s => <span key={s} style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(232,0,13,0.1)', border: `1px solid rgba(232,0,13,0.2)`, borderRadius: 20, color: COLORS.red }}>{s}</span>)}
                </div>
              </div>
            )}
            {(chef.instagram || chef.twitter || chef.youtube) && (
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Sosyal Medya</h3>
                {chef.instagram && <SocialLink href={`https://instagram.com/${chef.instagram.replace('@','')}`} label="Instagram" handle={chef.instagram} />}
                {chef.twitter && <SocialLink href={`https://twitter.com/${chef.twitter.replace('@','')}`} label="Twitter" handle={chef.twitter} />}
                {chef.youtube && <SocialLink href={`https://youtube.com/${chef.youtube}`} label="YouTube" handle={chef.youtube} />}
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ height: 64 }} />
    </Layout>
  );
}

function SocialLink({ href, label, handle }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${COLORS.border}`, textDecoration: 'none' }}>
      <span style={{ fontSize: 12, color: COLORS.muted }}>{label}</span>
      <span style={{ fontSize: 12, color: COLORS.red }}>{handle}</span>
    </a>
  );
}
