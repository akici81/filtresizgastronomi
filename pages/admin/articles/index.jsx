import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import { supabase } from '../../../lib/supabase';
import { COLORS, ARTICLE_CATEGORIES } from '../../../lib/constants';

export default function AdminArticles() {
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchArticles(); }, [statusFilter, categoryFilter]);

  async function fetchArticles() {
    setLoading(true);
    let query = supabase
      .from('articles')
      .select('id, title, slug, status, category, is_featured, is_editors_pick, published_at, created_at, profiles(full_name, username)')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (categoryFilter !== 'all') query = query.eq('category', categoryFilter);

    const { data } = await query;
    setArticles(data || []);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm('Bu makaleyi silmek istediğinize emin misiniz?')) return;
    setDeleting(id);
    await supabase.from('articles').delete().eq('id', id);
    setArticles(articles.filter(a => a.id !== id));
    setDeleting(null);
  }

  async function toggleFeatured(article) {
    await supabase.from('articles').update({ is_featured: !article.is_featured }).eq('id', article.id);
    setArticles(articles.map(a => a.id === article.id ? { ...a, is_featured: !a.is_featured } : a));
  }

  async function toggleEditorsPick(article) {
    await supabase.from('articles').update({ is_editors_pick: !article.is_editors_pick }).eq('id', article.id);
    setArticles(articles.map(a => a.id === article.id ? { ...a, is_editors_pick: !a.is_editors_pick } : a));
  }

  const filtered = articles.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Makaleler">
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Makale ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 6, padding: '10px 14px',
            color: COLORS.white, fontSize: 13, outline: 'none',
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 6, padding: '10px 14px',
            color: COLORS.white, fontSize: 13, outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="all">Tüm Durumlar</option>
          <option value="published">Yayında</option>
          <option value="draft">Taslak</option>
          <option value="pending">Bekliyor</option>
          <option value="archived">Arşiv</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 6, padding: '10px 14px',
            color: COLORS.white, fontSize: 13, outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="all">Tüm Kategoriler</option>
          {Object.entries(ARTICLE_CATEGORIES).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <button
          onClick={() => router.push('/admin/articles/new')}
          style={{
            background: COLORS.red, border: 'none',
            color: COLORS.white, padding: '10px 20px',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
            borderRadius: 6, cursor: 'pointer',
          }}
        >
          + YENİ MAKALE
        </button>
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 120px 120px 100px 140px',
          padding: '12px 20px',
          borderBottom: `1px solid ${COLORS.border}`,
          fontSize: 11, color: COLORS.muted, letterSpacing: '0.08em',
        }}>
          <span>MAKALE BAŞLIĞI</span>
          <span>KATEGORİ</span>
          <span>YAZAR</span>
          <span>DURUM</span>
          <span style={{ textAlign: 'right' }}>İŞLEMLER</span>
        </div>

        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 52, borderBottom: `1px solid ${COLORS.border}`, animation: 'pulse 1.5s infinite' }} />
          ))
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>
            {search ? 'Arama sonucu bulunamadı' : 'Henüz makale eklenmemiş'}
          </div>
        ) : (
          filtered.map((article) => (
            <div
              key={article.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 120px 100px 140px',
                padding: '14px 20px',
                borderBottom: `1px solid ${COLORS.border}`,
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{article.title}</span>
                {article.is_featured && (
                  <span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(232,0,13,0.15)', color: COLORS.red, borderRadius: 4 }}>
                    ÖNE ÇIKAN
                  </span>
                )}
                {article.is_editors_pick && (
                  <span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', borderRadius: 4 }}>
                    EDİTÖR SEÇİMİ
                  </span>
                )}
              </div>
              <span style={{ fontSize: 12, color: COLORS.dim }}>
                {ARTICLE_CATEGORIES[article.category] || '—'}
              </span>
              <span style={{ fontSize: 12, color: COLORS.dim }}>
                {article.profiles?.full_name || article.profiles?.username || '—'}
              </span>
              <StatusBadge status={article.status} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <ActionBtn onClick={() => toggleFeatured(article)} color={article.is_featured ? COLORS.red : COLORS.muted} title="Öne Çıkar">★</ActionBtn>
                <ActionBtn onClick={() => toggleEditorsPick(article)} color={article.is_editors_pick ? '#8b5cf6' : COLORS.muted} title="Editör Seçimi">✦</ActionBtn>
                <ActionBtn onClick={() => router.push(`/admin/articles/${article.id}`)} color={COLORS.dim} title="Düzenle">✎</ActionBtn>
                <ActionBtn onClick={() => handleDelete(article.id)} color="#ef4444" disabled={deleting === article.id} title="Sil">✕</ActionBtn>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && (
        <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 12 }}>
          {filtered.length} makale gösteriliyor
        </div>
      )}
    </AdminLayout>
  );
}

function StatusBadge({ status }) {
  const map = {
    published: { label: 'Yayında', color: '#10b981' },
    draft: { label: 'Taslak', color: '#f59e0b' },
    pending: { label: 'Bekliyor', color: '#3b82f6' },
    archived: { label: 'Arşiv', color: '#6b7280' },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: `${s.color}22`, color: s.color, letterSpacing: '0.05em' }}>
      {s.label}
    </span>
  );
}

function ActionBtn({ children, onClick, color, disabled, title }) {
  return (
    <button
      onClick={onClick} disabled={disabled} title={title}
      style={{
        background: 'transparent', border: `1px solid ${COLORS.border}`,
        color, width: 28, height: 28, borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13, display: 'flex', alignItems: 'center',
        justifyContent: 'center', opacity: disabled ? 0.5 : 1, transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.borderColor = color; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.borderColor = COLORS.border; }}
    >
      {children}
    </button>
  );
}