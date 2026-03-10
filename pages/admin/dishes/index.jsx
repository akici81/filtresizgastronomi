import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import { supabase } from '../../../lib/supabase';
import { COLORS } from '../../../lib/constants';

export default function AdminDishes() {
  const router = useRouter();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchDishes(); }, [statusFilter]);

  async function fetchDishes() {
    setLoading(true);
    let query = supabase
      .from('dishes')
      .select('id, name, slug, status, is_featured, category, created_at, cities(name)')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);

    const { data } = await query;
    setDishes(data || []);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm('Bu yemeği silmek istediğinize emin misiniz?')) return;
    setDeleting(id);
    await supabase.from('dishes').delete().eq('id', id);
    setDishes(dishes.filter(d => d.id !== id));
    setDeleting(null);
  }

  async function toggleFeatured(dish) {
    await supabase.from('dishes').update({ is_featured: !dish.is_featured }).eq('id', dish.id);
    setDishes(dishes.map(d => d.id === dish.id ? { ...d, is_featured: !d.is_featured } : d));
  }

  const filtered = dishes.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Yemekler">
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Yemek ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 6,
            padding: '10px 14px',
            color: COLORS.white,
            fontSize: 13,
            outline: 'none',
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 6,
            padding: '10px 14px',
            color: COLORS.white,
            fontSize: 13,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="all">Tüm Durumlar</option>
          <option value="published">Yayında</option>
          <option value="draft">Taslak</option>
          <option value="pending">Bekliyor</option>
          <option value="archived">Arşiv</option>
        </select>

        <button
          onClick={() => router.push('/admin/dishes/new')}
          style={{
            background: COLORS.red,
            border: 'none',
            color: COLORS.white,
            padding: '10px 20px',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          + YENİ YEMEK
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 120px 120px 100px 120px',
          padding: '12px 20px',
          borderBottom: `1px solid ${COLORS.border}`,
          fontSize: 11,
          color: COLORS.muted,
          letterSpacing: '0.08em',
        }}>
          <span>YEMEK ADI</span>
          <span>ŞEHİR</span>
          <span>KATEGORİ</span>
          <span>DURUM</span>
          <span style={{ textAlign: 'right' }}>İŞLEMLER</span>
        </div>

        {/* Rows */}
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} style={{
              height: 52,
              borderBottom: `1px solid ${COLORS.border}`,
              background: 'rgba(255,255,255,0.01)',
              animation: 'pulse 1.5s infinite',
            }} />
          ))
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>
            {search ? 'Arama sonucu bulunamadı' : 'Henüz yemek eklenmemiş'}
          </div>
        ) : (
          filtered.map((dish) => (
            <div
              key={dish.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 120px 100px 120px',
                padding: '14px 20px',
                borderBottom: `1px solid ${COLORS.border}`,
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {/* Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{dish.name}</span>
                {dish.is_featured && (
                  <span style={{
                    fontSize: 9,
                    padding: '2px 6px',
                    background: 'rgba(251,191,36,0.15)',
                    color: '#fbbf24',
                    borderRadius: 4,
                    letterSpacing: '0.05em',
                  }}>
                    ÖNE ÇIKAN
                  </span>
                )}
              </div>

              {/* City */}
              <span style={{ fontSize: 12, color: COLORS.dim }}>
                {dish.cities?.name || '—'}
              </span>

              {/* Category */}
              <span style={{ fontSize: 12, color: COLORS.dim }}>
                {dish.category || '—'}
              </span>

              {/* Status */}
              <StatusBadge status={dish.status} />

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <ActionBtn
                  onClick={() => toggleFeatured(dish)}
                  title={dish.is_featured ? 'Öne çıkanlardan kaldır' : 'Öne çıkar'}
                  color={dish.is_featured ? '#fbbf24' : COLORS.muted}
                >
                  ★
                </ActionBtn>
                <ActionBtn
                  onClick={() => router.push(`/admin/dishes/${dish.id}`)}
                  color={COLORS.dim}
                >
                  ✎
                </ActionBtn>
                <ActionBtn
                  onClick={() => handleDelete(dish.id)}
                  color="#ef4444"
                  disabled={deleting === dish.id}
                >
                  ✕
                </ActionBtn>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Count */}
      {!loading && (
        <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 12 }}>
          {filtered.length} yemek gösteriliyor
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
    <span style={{
      fontSize: 10,
      padding: '3px 8px',
      borderRadius: 4,
      background: `${s.color}22`,
      color: s.color,
      letterSpacing: '0.05em',
    }}>
      {s.label}
    </span>
  );
}

function ActionBtn({ children, onClick, color, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: 'transparent',
        border: `1px solid ${COLORS.border}`,
        color,
        width: 28,
        height: 28,
        borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.borderColor = color; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.borderColor = COLORS.border; }}
    >
      {children}
    </button>
  );
}