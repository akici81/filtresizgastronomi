import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { COLORS, ARTICLE_CATEGORIES } from '../lib/constants';

export default function ArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 12;

  useEffect(() => { fetchArticles(); }, [search, category, page]);

  async function fetchArticles() {
    setLoading(true);
    let query = supabase
      .from('articles')
      .select('id, title, slug, excerpt, cover_image_url, category, read_time, published_at, is_editors_pick, profiles(full_name, username)', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

    if (search) query = query.ilike('title', `%${search}%`);
    if (category) query = query.eq('category', category);

    const { data, count } = await query;
    setArticles(data || []);
    setTotal(count || 0);
    setLoading(false);
  }

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <Layout>
      <Head>
        <title>Makaleler | Filtresiz Gastronomi</title>
        <meta name="description" content="Gastronomi dünyasından haberler ve makaleler" />
      </Head>

      <div style={{ background: 'linear-gradient(180deg, #1a0000 0%, #0d0d0d 100%)', padding: '60px 0 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 40, fontWeight: 900, margin: '0 0 12px' }}>Makaleler</h1>
          <p style={{ fontSize: 16, color: COLORS.dim, margin: 0 }}>Gastronomi dünyasından haberler, hikayeler ve rehberler</p>
        </div>
      </div>

      <div style={{ borderBottom: `1px solid ${COLORS.border}`, background: '#0d0d0d', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 12, alignItems: 'center', height: 56 }}>
          <input type="text" placeholder="Makale ara..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 14px', color: COLORS.white, fontSize: 13, outline: 'none' }} />
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
            style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 14px', color: COLORS.white, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="">Tüm Kategoriler</option>
            {Object.entries(ARTICLE_CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
            {[...Array(9)].map((_, i) => <div key={i} style={{ height: 360, borderRadius: 12, background: COLORS.card, animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: COLORS.muted }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <div>Sonuç bulunamadı</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
            {articles.map(article => (
              <div key={article.id} onClick={() => router.push(`/article/${article.slug}`)}
                style={{ cursor: 'pointer', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden', transition: 'transform 0.2s, border-color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(232,0,13,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = COLORS.border; }}>
                <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                  {article.cover_image_url
                    ? <img src={article.cover_image_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', background: 'rgba(232,0,13,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>📝</div>}
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
                    {article.category && <span style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: '3px 10px', borderRadius: 20, fontSize: 10, color: COLORS.white }}>{ARTICLE_CATEGORIES[article.category] || article.category}</span>}
                    {article.is_editors_pick && <span style={{ background: 'rgba(139,92,246,0.8)', padding: '3px 10px', borderRadius: 20, fontSize: 10, color: COLORS.white }}>Editör Seçimi</span>}
                  </div>
                </div>
                <div style={{ padding: 20 }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, lineHeight: 1.4 }}>{article.title}</h3>
                  {article.excerpt && <p style={{ margin: '0 0 16px', fontSize: 13, color: COLORS.dim, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.excerpt}</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: COLORS.muted }}>
                      {article.profiles?.full_name || article.profiles?.username}
                      {article.published_at && ` · ${new Date(article.published_at).toLocaleDateString('tr-TR')}`}
                    </div>
                    {article.read_time && <span style={{ fontSize: 12, color: COLORS.dim }}>{article.read_time} dk okuma</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48 }}>
            <PageBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</PageBtn>
            {[...Array(Math.min(totalPages, 7))].map((_, i) => <PageBtn key={i} onClick={() => setPage(i + 1)} active={page === i + 1}>{i + 1}</PageBtn>)}
            <PageBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</PageBtn>
          </div>
        )}
      </div>
    </Layout>
  );
}

function PageBtn({ children, onClick, disabled, active }) {
  return <button onClick={onClick} disabled={disabled} style={{ width: 36, height: 36, borderRadius: 6, border: `1px solid ${active ? COLORS.red : COLORS.border}`, background: active ? COLORS.red : 'transparent', color: active ? COLORS.white : disabled ? COLORS.muted : COLORS.dim, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13 }}>{children}</button>;
}
