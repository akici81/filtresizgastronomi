import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
const ROLE_BADGE = {
  superadmin: { label: 'Süper Admin', color: '#f59e0b' },
  admin:      { label: 'Admin',       color: '#f59e0b' },
  editor:     { label: 'Editör',      color: '#3b82f6' },
  author:     { label: 'Yazar',       color: '#8b5cf6' },
  moderator:  { label: 'Moderatör',   color: '#10b981' },
  user:       { label: 'Üye',         color: 'var(--muted)' },
};

const TABS = [
  { key: 'about',    label: 'Hakkında' },
  { key: 'articles', label: 'Makaleler', roles: ['superadmin','admin','editor','author'] },
  { key: 'reviews',  label: 'Değerlendirmeler' },
  { key: 'favorites',label: 'Favoriler' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { username } = router.query;
  const { user, profile: myProfile } = useAuth();

  const [profile, setProfile] = useState(null);
  const [articles, setArticles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = myProfile?.username === username;

  useEffect(() => {
    if (username) fetchProfile();
  }, [username]);

  useEffect(() => {
    if (profile && user && !isOwnProfile) checkFollow();
  }, [profile, user]);

  useEffect(() => {
    if (!profile) return;
    if (activeTab === 'articles') fetchArticles();
    if (activeTab === 'reviews') fetchReviews();
    if (activeTab === 'favorites') fetchFavorites();
  }, [activeTab, profile]);

  async function fetchProfile() {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .maybeSingle();
    setProfile(data);
    setLoading(false);
  }

  async function checkFollow() {
    const { data, error } = await supabase
      .from('user_follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .maybeSingle();
    if (!error) setIsFollowing(!!data);
  }

  async function toggleFollow() {
    if (!user) { router.push('/login'); return; }
    setFollowLoading(true);
    if (isFollowing) {
      const { error } = await supabase.from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.id);
      if (!error) {
        setIsFollowing(false);
        setProfile(prev => ({ ...prev, followers_count: Math.max(0, (prev.followers_count || 0) - 1) }));
      }
    } else {
      const { error } = await supabase.from('user_follows')
        .insert({ follower_id: user.id, following_id: profile.id });
      if (!error) {
        setIsFollowing(true);
        setProfile(prev => ({ ...prev, followers_count: (prev.followers_count || 0) + 1 }));
      } else {
        console.error('toggleFollow error:', error.message);
      }
    }
    setFollowLoading(false);
    await checkFollow();
  }

  async function fetchArticles() {
    const { data } = await supabase
      .from('articles')
      .select('id, title, slug, excerpt, cover_image_url, published_at, view_count, like_count')
      .eq('author_id', profile.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20);
    setArticles(data || []);
  }

  async function fetchReviews() {
    const { data } = await supabase
      .from('reviews')
      .select('id, rating, content, created_at, dishes(name, slug), restaurants(name, slug)')
      .eq('user_id', profile.id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(20);
    setReviews(data || []);
  }

  async function fetchFavorites() {
    const { data } = await supabase
      .from('favorites')
      .select(`
        id, collection_name,
        dishes(id, name, slug, cover_image_url),
        restaurants(id, name, slug, image_url),
        articles(id, title, slug, cover_image_url)
      `)
      .eq('user_id', profile.id)
      .limit(24);
    setFavorites(data || []);
  }

  if (loading) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '120px 24px', color: 'var(--muted)' }}>Yükleniyor...</div>
    </Layout>
  );

  if (!profile) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '120px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
        <h2 style={{ margin: '0 0 8px' }}>Kullanıcı bulunamadı</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>@{username} kullanıcısı mevcut değil veya hesabı aktif değil.</p>
        <button onClick={() => router.push('/')} style={{ marginTop: 20, background: 'var(--red)', border: 'none', color: 'var(--text)', padding: '10px 24px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
          Ana Sayfaya Dön
        </button>
      </div>
    </Layout>
  );

  const badge = ROLE_BADGE[profile.role] || ROLE_BADGE.user;
  const visibleTabs = TABS.filter(t => !t.roles || t.roles.includes(profile.role));
  const socialLinks = [
    profile.instagram && { icon: '📸', label: 'Instagram', url: `https://instagram.com/${profile.instagram.replace('@','')}` },
    profile.twitter   && { icon: '🐦', label: 'Twitter',   url: `https://twitter.com/${profile.twitter.replace('@','')}` },
    profile.website   && { icon: '🌐', label: 'Website',   url: profile.website },
  ].filter(Boolean);

  return (
    <Layout>
      <Head>
        <title>{profile.full_name || profile.username} | Filtresiz Gastronomi</title>
        <meta name="description" content={profile.bio || `@${profile.username} profili`} />
      </Head>

      {/* Cover */}
      <div style={{ position: 'relative', height: 220, background: 'var(--hero-bg)', overflow: 'hidden' }}>
        {profile.cover_image_url && (
          <img src={profile.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, var(--bg) 0%, transparent 60%)' }} />
      </div>

      {/* Profil Ana Bilgi */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginTop: -56, marginBottom: 32, position: 'relative', zIndex: 1 }}>
          {/* Avatar */}
          <div style={{ flexShrink: 0 }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} style={{ width: 112, height: 112, borderRadius: '50%', objectFit: 'cover', border: `4px solid var(--bg)` }} />
            ) : (
              <div style={{ width: 112, height: 112, borderRadius: '50%', background: 'var(--red)', border: `4px solid var(--bg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 900, color: 'var(--text)' }}>
                {(profile.full_name || profile.username || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* İsim & Butonlar */}
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
                {profile.full_name || profile.username}
              </h1>
              {profile.is_verified && (
                <span title="Doğrulanmış hesap" style={{ fontSize: 16, color: '#3b82f6' }}>✓</span>
              )}
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: `${badge.color}20`, color: badge.color, fontWeight: 700, letterSpacing: '0.05em' }}>
                {badge.label}
              </span>
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 8 }}>@{profile.username}</div>
            {profile.bio && (
              <p style={{ margin: 0, fontSize: 14, color: 'var(--dim)', lineHeight: 1.6, maxWidth: 500 }}>{profile.bio}</p>
            )}
          </div>

          {/* Butonlar */}
          <div style={{ display: 'flex', gap: 10, paddingBottom: 4, flexShrink: 0 }}>
            {isOwnProfile ? (
              <button
                onClick={() => router.push('/hesap')}
                style={{ background: 'var(--input-bg)', border: `1px solid ${'var(--border)'}`, color: 'var(--text)', padding: '9px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                Profili Düzenle
              </button>
            ) : user ? (
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                style={{ background: isFollowing ? 'transparent' : 'var(--red)', border: `1px solid ${isFollowing ? 'var(--border)' : 'var(--red)'}`, color: isFollowing ? 'var(--dim)' : 'var(--text)', padding: '9px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }}
              >
                {followLoading ? '...' : isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
              </button>
            ) : (
              <button
                onClick={() => router.push('/login')}
                style={{ background: 'var(--red)', border: 'none', color: 'var(--text)', padding: '9px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                Takip Et
              </button>
            )}
          </div>
        </div>

        {/* İstatistikler + Sosyal */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          <StatItem value={profile.reviews_count || 0} label="Değerlendirme" />
          <StatItem value={profile.favorites_count || 0} label="Favori" />
          <StatItem value={profile.followers_count || 0} label="Takipçi" onClick={() => {}} />
          <StatItem value={profile.following_count || 0} label="Takip" onClick={() => {}} />

          {socialLinks.length > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
              {socialLinks.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: 'var(--dim)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                  title={s.label}>
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Sekmeler */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${'var(--border)'}`, marginBottom: 32 }}>
          {visibleTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: 'transparent', border: 'none', color: activeTab === tab.key ? 'var(--text)' : 'var(--dim)',
                padding: '12px 20px', fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 400,
                cursor: 'pointer', borderBottom: activeTab === tab.key ? `2px solid ${'var(--red)'}` : '2px solid transparent',
                marginBottom: -1, transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sekme İçerikleri */}
        <div style={{ paddingBottom: 80 }}>

          {/* Hakkında */}
          {activeTab === 'about' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32 }}>
              <div>
                {profile.bio ? (
                  <Section title="Biyografi">
                    <p style={{ margin: 0, fontSize: 15, color: 'var(--dim)', lineHeight: 1.8 }}>{profile.bio}</p>
                  </Section>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
                    <p style={{ margin: 0, fontSize: 14 }}>Henüz biyografi eklenmemiş.</p>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Section title="Bilgiler">
                  {profile.website && (
                    <InfoRow icon="🌐" label="Website">
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--red)', textDecoration: 'none', fontSize: 13 }}>{profile.website.replace(/https?:\/\//, '')}</a>
                    </InfoRow>
                  )}
                  <InfoRow icon="📅" label="Üye">
                    <span style={{ fontSize: 13, color: 'var(--dim)' }}>{new Date(profile.created_at).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</span>
                  </InfoRow>
                  {profile.role !== 'user' && (
                    <InfoRow icon="🏷" label="Rol">
                      <span style={{ fontSize: 13, color: badge.color, fontWeight: 600 }}>{badge.label}</span>
                    </InfoRow>
                  )}
                </Section>
              </div>
            </div>
          )}

          {/* Makaleler */}
          {activeTab === 'articles' && (
            <div>
              {articles.length === 0 ? (
                <Empty icon="📰" text="Henüz yayınlanmış makale yok." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {articles.map(article => (
                    <div
                      key={article.id}
                      onClick={() => router.push(`/article/${article.slug}`)}
                      style={{ display: 'flex', gap: 16, padding: 16, background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 8, cursor: 'pointer', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      {article.cover_image_url && (
                        <img src={article.cover_image_url} alt={article.title} style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>{article.title}</h3>
                        {article.excerpt && <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--dim)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.excerpt}</p>}
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
                          <span>{new Date(article.published_at).toLocaleDateString('tr-TR')}</span>
                          {article.view_count > 0 && <span>👁 {article.view_count}</span>}
                          {article.like_count > 0 && <span>♥ {article.like_count}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Değerlendirmeler */}
          {activeTab === 'reviews' && (
            <div>
              {reviews.length === 0 ? (
                <Empty icon="⭐" text="Henüz değerlendirme yapılmamış." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reviews.map(review => {
                    const target = review.dishes || review.restaurants;
                    const targetSlug = review.dishes ? `/dish/${review.dishes.slug}` : `/restaurant/${review.restaurants?.slug}`;
                    return (
                      <div key={review.id} style={{ padding: 16, background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span
                            onClick={() => router.push(targetSlug)}
                            style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--border)' }}
                          >
                            {target?.name}
                          </span>
                          <Stars rating={review.rating} />
                        </div>
                        {review.content && <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--dim)', lineHeight: 1.6 }}>{review.content}</p>}
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(review.created_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Favoriler */}
          {activeTab === 'favorites' && (
            <div>
              {favorites.length === 0 ? (
                <Empty icon="♥" text="Henüz favori eklenmemiş." />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                  {favorites.map(fav => {
                    const item = fav.dishes || fav.restaurants || fav.articles;
                    if (!item) return null;
                    const href = fav.dishes ? `/dish/${fav.dishes.slug}` : fav.restaurants ? `/restaurant/${fav.restaurants.slug}` : `/article/${fav.articles.slug}`;
                    const img = fav.dishes?.cover_image_url || fav.restaurants?.image_url || fav.articles?.cover_image_url;
                    const name = fav.dishes?.name || fav.restaurants?.name || fav.articles?.title;
                    return (
                      <div
                        key={fav.id}
                        onClick={() => router.push(href)}
                        style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                      >
                        {img ? (
                          <img src={img} alt={name} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: 120, background: 'var(--subtle-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                            {fav.dishes ? '🍽' : fav.restaurants ? '🏪' : '📰'}
                          </div>
                        )}
                        <div style={{ padding: '10px 12px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, color: 'var(--text)' }}>{name}</div>
                          {fav.collection_name && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>📁 {fav.collection_name}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// — Yardımcı Komponentler —

function StatItem({ value, label, onClick }) {
  return (
    <div onClick={onClick} style={{ textAlign: 'center', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted)' }}>
        {title.toUpperCase()}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{icon}</span>
      <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 60 }}>{label}</span>
      {children}
    </div>
  );
}

function Stars({ rating }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 12, color: i <= rating ? '#f59e0b' : 'var(--border)' }}>★</span>
      ))}
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 14 }}>{text}</p>
    </div>
  );
}