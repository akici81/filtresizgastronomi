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
    const { data } = await supabase.from('favorites').select('id').eq('user_id', user.id).eq('entity_type', 'article').eq('entity_id', article.id).single();
    setIsFavorited(!!data);
  }

  async function toggleFavorite() {
    if (!user) { router.push('/login'); return; }
    if (isFavorited) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('entity_type', 'article').eq('entity_id', article.id);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, entity_type: 'article', entity_id: article.id });
    }
    setIsFavorited(!isFavorited);
  }

  if (loading) return <Layout><div style={{ textAlign: 'center', padding: '120px 24px', color: COLORS.muted }}>Yükleniyor...</div></Layout>;
  if (!article) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '120px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
        <h2>Makale bulunamadı</h2>
        <button onClick={() => router.push('/articles')} style={{ marginTop: 16, background: COLORS.red, border: 'none', color: COLORS.white, padding: '10px 24px', borderRadius: 6, cursor: 'pointer' }}>Tüm Makaleler</button>
      </div>
    </Layout>
  );

  const tags = Array.isArray(article.tags) ? article.tags : [];

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
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 48px 48px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {article.category && <span style={{ background: COLORS.red, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{ARTICLE_CATEGORIES[article.category] || article.category}</span>}
              {article.is_editors_pick && <span style={{ background: 'rgba(139,92,246,0.8)', padding: '4px 12px', borderRadius: 20, fontSize: 11 }}>Editör Seçimi</span>}
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 900, margin: '0 0 16px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>{article.title}</h1>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{article.profiles?.full_name || article.profiles?.username}</span>
              {article.published_at && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{new Date(article.published_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
              {article.read_time && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{article.read_time} dk okuma</span>}
            </div>
          </div>
        </div>
        <button onClick={toggleFavorite} style={{ position: 'absolute', top: 24, right: 24, background: isFavorited ? COLORS.red : 'rgba(0,0,0,0.6)', border: `1px solid ${isFavorited ? COLORS.red : 'rgba(255,255,255,0.2)'}`, backdropFilter: 'blur(8px)', color: COLORS.white, width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isFavorited ? '♥' : '♡'}
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        {article.excerpt && (
          <p style={{ fontSize: 19, color: COLORS.dim, lineHeight: 1.7, marginBottom: 40, paddingBottom: 40, borderBottom: `1px solid ${COLORS.border}`, fontStyle: 'italic' }}>
            {article.excerpt}
          </p>
        )}

        {article.content && (
          <div style={{ fontSize: 16, color: COLORS.dim, lineHeight: 1.9, marginBottom: 48 }}
            dangerouslySetInnerHTML={{ __html: article.content }} />
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40, paddingTop: 32, borderTop: `1px solid ${COLORS.border}` }}>
            {tags.map(tag => <span key={tag} style={{ fontSize: 12, padding: '4px 12px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 20, color: COLORS.dim, cursor: 'pointer' }}>#{tag}</span>)}
          </div>
        )}

        {/* Author */}
        {article.profiles && (
          <div style={{ display: 'flex', gap: 16, padding: 24, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, marginBottom: 48 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: COLORS.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
              {(article.profiles.full_name || article.profiles.username || 'Y')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{article.profiles.full_name || article.profiles.username}</div>
              {article.profiles.bio && <div style={{ fontSize: 13, color: COLORS.dim, lineHeight: 1.5 }}>{article.profiles.bio}</div>}
            </div>
          </div>
        )}

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>İlgili Makaleler</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {related.map(r => (
                <div key={r.id} onClick={() => router.push(`/article/${r.slug}`)} style={{ cursor: 'pointer', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(232,0,13,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}>
                  <div style={{ height: 120, overflow: 'hidden' }}>
                    {r.cover_image_url ? <img src={r.cover_image_url} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'rgba(232,0,13,0.08)' }} />}
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.title}</div>
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
