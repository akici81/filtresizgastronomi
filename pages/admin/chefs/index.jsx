import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import { supabase } from '../../../lib/supabase';
import { COLORS } from '../../../lib/constants';

export default function AdminChefs() {
  const router = useRouter();
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchChefs(); }, [statusFilter]);

  async function fetchChefs() {
    setLoading(true);
    let query = supabase
      .from('chefs')
      .select('id, name, slug, title, status, is_featured, created_at, cities(name)')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data } = await query;
    setChefs(data || []);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm('Bu şefi silmek istediğinize emin misiniz?')) return;
    setDeleting(id);
    await supabase.from('chefs').delete().eq('id', id);
    setChefs(chefs.filter(c => c.id !== id));
    setDeleting(null);
  }

  async function toggleFeatured(chef) {
    await supabase.from('chefs').update({ is_featured: !chef.is_featured }).eq('id', chef.id);
    setChefs(chefs.map(c => c.id === chef.id ? { ...c, is_featured: !c.is_featured } : c));
  }

  const filtered = chefs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Şefler">
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Şef ara..."
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
        <button
          onClick={() => router.push('/admin/chefs/new')}
          style={{
            background: COLORS.red, border: 'none',
            color: COLORS.white, padding: '10px 20px',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
            borderRadius: 6, cursor: 'pointer',
          }}
        >
          + YENİ ŞEF
        </button>
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 160px 160px 100px 120px',
          padding: '12px 20px',
          borderBottom: `1px solid ${COLORS.border}`,
          fontSize: 11, color: COLORS.muted, letterSpacing: '0.08em',
        }}>
          <span>ŞEF ADI</span>
          <span>ÜNVAN</span>
          <span>ŞEHİR</span>
          <span>DURUM</span>
          <span style={{ textAlign: 'right' }}>İŞLEMLER</span>
        </div>

        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 52, borderBottom: `1px solid ${COLORS.border}`, animation: 'pulse 1.5s infinite' }} />
          ))
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>
            {search ? 'Arama sonucu bulunamadı' : 'Henüz şef eklenmemiş'}
          </div>
        ) : (
          filtered.map((chef) => (
            <div
              key={chef.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 160px 160px 100px 120px',
                padding: '14px 20px',
                borderBottom: `1px solid ${COLORS.border}`,
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{chef.name}</span>
                {chef.is_featured && (
                  <span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(232,0,13,0.15)', color: COLORS.red, borderRadius: 4 }}>
                    ÖNE ÇIKAN
                  </span>
                )}
              </div>
              <span style={{ fontSize: 12, color: COLORS.dim }}>{chef.title || '—'}</span>
              <span style={{ fontSize: 12, color: COLORS.dim }}>{chef.cities?.name || '—'}</span>
              <StatusBadge status={chef.status} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <ActionBtn onClick={() => toggleFeatured(chef)} color={chef.is_featured ? COLORS.red : COLORS.muted} title="Öne Çıkar">★</ActionBtn>
                <ActionBtn onClick={() => router.push(`/admin/chefs/${chef.id}`)} color={COLORS.dim} title="Düzenle">✎</ActionBtn>
                <ActionBtn onClick={() => handleDelete(chef.id)} color="#ef4444" disabled={deleting === chef.id} title="Sil">✕</ActionBtn>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && (
        <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 12 }}>
          {filtered.length} şef gösteriliyor
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