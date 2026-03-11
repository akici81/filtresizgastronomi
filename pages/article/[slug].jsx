import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { COLORS, ARTICLE_CATEGORIES } from '../../lib/constants';

export default function ArticleDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favId, setFavId] = useState(null);

  useEffect(() => { if (slug) fetchArticle(); }, [slug]);
  useEffect(() => { if (article && user) checkFavorite(); }, [article, user]);

  async function fetchArticle() {
    setLoading(true);
    const { data } = await supabase
      .from('articles')
      .select('*, profiles(full_name, username, avatar_url, bio), cities(name, slug), dishes(name, slug), restaurants(name, slug), chefs(name, slug)')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();
    setArticle(data);
    if (data) {
      const { data: r } = await supabase
        .from('articles')
        .select('id, title, slug, cover_image_url, category, published_at')
        .eq('status', 'published')
        .eq('category', data.category)
        .neq('id', data.id)
        .limit(3);
      setRelated(r || []);
    }
    setLoading(false);
  }

  async function checkFavorite() {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('article_id', article.id)
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
        .insert({ user_id: user.id, article_id: article.id })
        .select('id')
        .single();
      setIsFavorited(true);
      setFavId(data?.id || null);
    }
  }

  if (loading) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '120px 24px', color: COLORS.muted }}>Yükleniyor...</div>
    </Layout>
  );

  if (!article) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '120px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
        <h2>Makale bulunamadı</h2>
        <button onClick={() => router.push('/articles')} style={{ marginTop: 16, background: COLORS.red, border: 'none', color: COLORS.white, padding: '10px 24px', borderRadius: 6, cursor: 'pointer' }}>
          Tüm Makaleler
        </button>
      </div>
    </Layout>
  );

  const tags = Array.isArray(article.tags) ? article.tags : [];
  const gallery = Array.isArray(article.gallery) ? article.gallery : [];

  return (
    <Layout>
      <Head>
        <title>{article.seo_title || `${article.title} | Filtresiz Gastronomi`}</title>
        <meta name="description" content={article.seo_description || article.excerpt || ''} />
        {article.og_image_url && <meta property="og:image" content={article.og_image_url} />}
      </Head>

      {/* Hero */}
      <div style={{ position: 'relative', height: 500, overflow: 'hidden' }}>
        {article.cover_image_url
          ? <img src={article.cover_image_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a0000, #0d0d0d)' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }} />

        {/* Hero alt bilgi */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 48px 48px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {article.category && (
                <span style={{ background: COLORS.red, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  {ARTICLE_CATEGORIES[article.category] || article.category}
                </span>
              )}
              {article.is_editors_pick && (
                <span style={{ background: 'rgba(139,92,246,0.8)', padding: '4px 12px', borderRadius: 20, fontSize: 11 }}>Editör Seçimi</span>
              )}
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 900, margin: '0 0 16px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              {article.title}
            </h1>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              {article.profiles && (
                <span
                  onClick={() => router.push(`/profil/${article.profiles.username}`)}
                  style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.3)' }}
                >
                  {article.profiles.full_name || article.profiles.username}
                </span>
              )}
              {article.published_at && (
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                  {new Date(article.published_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
              {article.read_time && (
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{article.read_time} dk okuma</span>
              )}
            </div>
          </div>
        </div>

        {/* Favori butonu */}
        <button
          onClick={toggleFavorite}
          style={{ position: 'absolute', top: 24, right: 24, background: isFavorited ? COLORS.red : 'rgba(0,0,0,0.6)', border: `1px solid ${isFavorited ? COLORS.red : 'rgba(255,255,255,0.2)'}`, backdropFilter: 'blur(8px)', color: COLORS.white, width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isFavorited ? '♥' : '♡'}
        </button>
      </div>

      {/* İçerik */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>

        {article.excerpt && (
          <p style={{ fontSize: 19, color: COLORS.dim, lineHeight: 1.7, marginBottom: 40, paddingBottom: 40, borderBottom: `1px solid ${COLORS.border}`, fontStyle: 'italic' }}>
            {article.excerpt}
          </p>
        )}

        {article.content && (
          <div
            style={{ fontSize: 16, color: COLORS.dim, lineHeight: 1.9, marginBottom: 48 }}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        )}

        {/* Galeri */}
        {gallery.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Galeri</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              {gallery.map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 8 }} />
              ))}
            </div>
          </div>
        )}

        {/* İlişkili içerikler */}
        {(article.dishes || article.restaurants || article.chefs || article.cities) && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40, padding: '16px 20px', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
            <span style={{ fontSize: 12, color: COLORS.muted, alignSelf: 'center' }}>İlgili:</span>
            {article.dishes && (
              <span onClick={() => router.push(`/dish/${article.dishes.slug}`)} style={{ fontSize: 12, padding: '4px 10px', background: 'rgba(232,0,13,0.1)', border: '1px solid rgba(232,0,13,0.2)', borderRadius: 20, color: COLORS.red, cursor: 'pointer' }}>
                🍽 {article.dishes.name}
              </span>
            )}
            {article.restaurants && (
              <span onClick={() => router.push(`/restaurant/${article.restaurants.slug}`)} style={{ fontSize: 12, padding: '4px 10px', background: 'rgba(232,0,13,0.1)', border: '1px solid rgba(232,0,13,0.2)', borderRadius: 20, color: COLORS.red, cursor: 'pointer' }}>
                🏪 {article.restaurants.name}
              </span>
            )}
            {article.chefs && (
              <span onClick={() => router.push(`/chef/${article.chefs.slug}`)} style={{ fontSize: 12, padding: '4px 10px', background: 'rgba(232,0,13,0.1)', border: '1px solid rgba(232,0,13,0.2)', borderRadius: 20, color: COLORS.red, cursor: 'pointer' }}>
                👨‍🍳 {article.chefs.name}
              </span>
            )}
            {article.cities && (
              <span onClick={() => router.push(`/city/${article.cities.slug}`)} style={{ fontSize: 12, padding: '4px 10px', background: 'rgba(232,0,13,0.1)', border: '1px solid rgba(232,0,13,0.2)', borderRadius: 20, color: COLORS.red, cursor: 'pointer' }}>
                🗺 {article.cities.name}
              </span>
            )}
          </div>
        )}

        {/* Etiketler */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40, paddingTop: 32, borderTop: `1px solid ${COLORS.border}` }}>
            {tags.map(tag => (
              <span key={tag} style={{ fontSize: 12, padding: '4px 12px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 20, color: COLORS.dim }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Yazar kutusu */}
        {article.profiles && (
          <div
            onClick={() => router.push(`/profil/${article.profiles.username}`)}
            style={{ display: 'flex', gap: 16, padding: 24, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, marginBottom: 48, cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
          >
            {article.profiles.avatar_url ? (
              <img src={article.profiles.avatar_url} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: COLORS.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                {(article.profiles.full_name || article.profiles.username || 'Y')[0].toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                {article.profiles.full_name || article.profiles.username}
              </div>
              <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>@{article.profiles.username}</div>
              {article.profiles.bio && (
                <div style={{ fontSize: 13, color: COLORS.dim, lineHeight: 1.5 }}>{article.profiles.bio}</div>
              )}
            </div>
            <div style={{ fontSize: 12, color: COLORS.red, alignSelf: 'center', flexShrink: 0 }}>Profili Gör →</div>
          </div>
        )}

        {/* İlgili Makaleler */}
        {related.length > 0 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>İlgili Makaleler</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {related.map(r => (
                <div
                  key={r.id}
                  onClick={() => router.push(`/article/${r.slug}`)}
                  style={{ cursor: 'pointer', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(232,0,13,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
                >
                  <div style={{ height: 120, overflow: 'hidden' }}>
                    {r.cover_image_url
                      ? <img src={r.cover_image_url} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', background: 'rgba(232,0,13,0.08)' }} />}
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {r.title}
                    </div>
                    {r.published_at && (
                      <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 6 }}>
                        {new Date(r.published_at).toLocaleDateString('tr-TR')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}