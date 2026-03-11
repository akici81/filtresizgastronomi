import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
export default function ChefDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { user } = useAuth();
  const [chef, setChef] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favId, setFavId] = useState(null);

  useEffect(() => { if (slug) fetchChef(); }, [slug]);
  useEffect(() => { if (chef && user) checkFavorite(); }, [chef, user]);

  async function fetchChef() {
    setLoading(true);
    const { data } = await supabase
      .from('chefs')
      .select('*, cities(name, slug)')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();
    setChef(data);
    if (data) {
      // restaurant_chefs junction tablosu varsa kullan, yoksa boş bırak
      const { data: rData } = await supabase
        .from('restaurant_chefs')
        .select('restaurants(id, name, slug, image_url, cuisine_type, rating_avg)')
        .eq('chef_id', data.id);
      setRestaurants(rData?.map(r => r.restaurants).filter(Boolean) || []);
    }
    setLoading(false);
  }

  async function checkFavorite() {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('chef_id', chef.id)
      .maybeSingle();
    setIsFavorited(!!data);
    setFavId(data?.id || null);
  }

  async function toggleFavorite() {
    if (!user) { router.push('/login'); return; }
    if (isFavorited && favId) {
      await supabase.from('favorites').delete().eq('id', favId);
      setIsFavorited(false);
      setFavId(null);
    } else {
      const { data } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, chef_id: chef.id })
        .select('id')
        .single();
      setIsFavorited(true);
      setFavId(data?.id || null);
    }
  }

  if (loading) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '120px 24px', color: 'var(--muted)' }}>Yükleniyor...</div>
    </Layout>
  );

  if (!chef) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '120px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍🍳</div>
        <h2>Şef bulunamadı</h2>
        <button onClick={() => router.push('/chefs')} style={{ marginTop: 16, background: 'var(--red)', border: 'none', color: 'var(--text)', padding: '10px 24px', borderRadius: 6, cursor: 'pointer' }}>
          Tüm Şefler
        </button>
      </div>
    </Layout>
  );

  const specialties = Array.isArray(chef.specialties) ? chef.specialties : [];
  const awards = Array.isArray(chef.awards) ? chef.awards : [];
  const careerHistory = Array.isArray(chef.career_history) ? chef.career_history : [];
  const gallery = Array.isArray(chef.gallery) ? chef.gallery : [];

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
          : <div style={{ width: '100%', height: '100%', background: 'var(--hero-bg)' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)' }} />
        <button
          onClick={toggleFavorite}
          style={{ position: 'absolute', top: 24, right: 24, background: isFavorited ? 'var(--red)' : 'rgba(0,0,0,0.6)', border: `1px solid ${isFavorited ? 'var(--red)' : 'rgba(255,255,255,0.2)'}`, backdropFilter: 'blur(8px)', color: 'var(--text)', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isFavorited ? '♥' : '♡'}
        </button>
      </div>

      {/* Profil Bölümü */}
      <div style={{ maxWidth: 900, margin: '-80px auto 0', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end', marginBottom: 48 }}>
          <div style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', border: `4px solid ${'var(--bg)'}`, flexShrink: 0 }}>
            {chef.image_url
              ? <img src={chef.image_url} alt={chef.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 700 }}>{chef.name[0]}</div>}
          </div>
          <div style={{ paddingBottom: 8 }}>
            <h1 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 6px' }}>{chef.name}</h1>
            {chef.title && <div style={{ fontSize: 15, color: 'var(--red)', marginBottom: 8 }}>{chef.title}</div>}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {chef.cities?.name && <span style={{ fontSize: 13, color: 'var(--dim)' }}>📍 {chef.cities.name}</span>}
              {chef.experience_years && <span style={{ fontSize: 13, color: 'var(--dim)' }}>⏱ {chef.experience_years} yıl deneyim</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 48 }}>
          {/* Sol */}
          <div>
            {chef.short_bio && (
              <p style={{ fontSize: 17, color: 'var(--dim)', lineHeight: 1.7, marginBottom: 40, paddingBottom: 40, borderBottom: `1px solid ${'var(--border)'}` }}>
                {chef.short_bio}
              </p>
            )}

            {chef.bio && (
              <Section title="Biyografi">
                <div style={{ fontSize: 15, color: 'var(--dim)', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: chef.bio }} />
              </Section>
            )}

            {/* Kariyer Geçmişi */}
            {careerHistory.length > 0 && (
              <Section title="Kariyer">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {careerHistory.map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: `1px solid ${'var(--border)'}` }}>
                      <div style={{ fontSize: 12, color: 'var(--muted)', minWidth: 90, flexShrink: 0 }}>{c.years}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{c.position}</div>
                        <div style={{ fontSize: 13, color: 'var(--dim)' }}>{c.place}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Ödüller */}
            {awards.length > 0 && (
              <Section title="Ödüller & Başarılar">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {awards.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8 }}>
                      <span style={{ fontSize: 20 }}>🏆</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{a.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.organization}{a.year ? ` — ${a.year}` : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {chef.education && (
              <Section title="Eğitim">
                <div style={{ fontSize: 15, color: 'var(--dim)', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: chef.education }} />
              </Section>
            )}

            {/* Galeri */}
            {gallery.length > 0 && (
              <Section title="Galeri">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {gallery.map((url, i) => (
                    <img key={i} src={url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
                  ))}
                </div>
              </Section>
            )}

            {/* Restoranlar */}
            {restaurants.length > 0 && (
              <Section title="Restoranlar">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {restaurants.map(r => (
                    <div key={r.id} onClick={() => router.push(`/restaurant/${r.slug}`)}
                      style={{ display: 'flex', gap: 16, padding: 16, background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 10, cursor: 'pointer', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(232,0,13,0.4)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                      <div style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                        {r.image_url
                          ? <img src={r.image_url} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', background: 'rgba(232,0,13,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏪</div>}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{r.name}</div>
                        {r.cuisine_type && <div style={{ fontSize: 12, color: 'var(--dim)' }}>{r.cuisine_type}</div>}
                        {r.rating_avg > 0 && <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>★ {Number(r.rating_avg).toFixed(1)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Sağ Sidebar */}
          <div>
            <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Bilgiler</h3>
              {[
                chef.cities?.name && { label: 'Şehir', value: chef.cities.name },
                chef.experience_years && { label: 'Deneyim', value: `${chef.experience_years} yıl` },
                awards.length > 0 && { label: 'Ödül', value: `${awards.length} ödül` },
              ].filter(Boolean).map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${'var(--border)'}` }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>

            {specialties.length > 0 && (
              <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Uzmanlıklar</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {specialties.map(s => (
                    <span key={s} style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(232,0,13,0.1)', border: '1px solid rgba(232,0,13,0.2)', borderRadius: 20, color: 'var(--red)' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {(chef.instagram || chef.twitter || chef.youtube || chef.tiktok || chef.website) && (
              <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 12, padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Sosyal Medya</h3>
                {chef.instagram && <SocialLink href={`https://instagram.com/${chef.instagram.replace('@', '')}`} label="Instagram" handle={chef.instagram} />}
                {chef.twitter && <SocialLink href={`https://twitter.com/${chef.twitter.replace('@', '')}`} label="Twitter" handle={chef.twitter} />}
                {chef.youtube && <SocialLink href={`https://youtube.com/${chef.youtube}`} label="YouTube" handle={chef.youtube} />}
                {chef.tiktok && <SocialLink href={`https://tiktok.com/@${chef.tiktok.replace('@', '')}`} label="TikTok" handle={chef.tiktok} />}
                {chef.website && <SocialLink href={chef.website} label="Website" handle={chef.website.replace(/https?:\/\//, '')} />}
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ height: 64 }} />
    </Layout>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 40, paddingBottom: 40, borderBottom: `1px solid ${'var(--border)'}` }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>{title}</h2>
      {children}
    </div>
  );
}

function SocialLink({ href, label, handle }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${'var(--border)'}`, textDecoration: 'none' }}>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--red)' }}>{handle}</span>
    </a>
  );
}