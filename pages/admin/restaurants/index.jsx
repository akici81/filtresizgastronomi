import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import { supabase } from '../../../lib/supabase';
export default function AdminRestaurants() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchRestaurants(); }, [statusFilter]);

  async function fetchRestaurants() {
    setLoading(true);
    let query = supabase
      .from('restaurants')
      .select('id, name, slug, status, is_featured, is_premium, cuisine_type, created_at, cities(name)')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);

    const { data } = await query;
    setRestaurants(data || []);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm('Bu restoranı silmek istediğinize emin misiniz?')) return;
    setDeleting(id);
    await supabase.from('restaurants').delete().eq('id', id);
    setRestaurants(restaurants.filter(r => r.id !== id));
    setDeleting(null);
  }

  async function toggleFeatured(restaurant) {
    await supabase.from('restaurants').update({ is_featured: !restaurant.is_featured }).eq('id', restaurant.id);
    setRestaurants(restaurants.map(r => r.id === restaurant.id ? { ...r, is_featured: !r.is_featured } : r));
  }

  async function togglePremium(restaurant) {
    await supabase.from('restaurants').update({ is_premium: !restaurant.is_premium }).eq('id', restaurant.id);
    setRestaurants(restaurants.map(r => r.id === restaurant.id ? { ...r, is_premium: !r.is_premium } : r));
  }

  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Restoranlar">
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Restoran ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200,
            background: 'var(--subtle-bg)',
            border: `1px solid ${'var(--border)'}`,
            borderRadius: 6, padding: '10px 14px',
            color: 'var(--text)', fontSize: 13, outline: 'none',
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: 'var(--subtle-bg)',
            border: `1px solid ${'var(--border)'}`,
            borderRadius: 6, padding: '10px 14px',
            color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="all">Tüm Durumlar</option>
          <option value="published">Yayında</option>
          <option value="draft">Taslak</option>
          <option value="pending">Bekliyor</option>
          <option value="archived">Arşiv</option>
        </select>
        <button
          onClick={() => router.push('/admin/restaurants/new')}
          style={{
            background: 'var(--red)', border: 'none',
            color: 'var(--text)', padding: '10px 20px',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
            borderRadius: 6, cursor: 'pointer',
          }}
        >
          + YENİ RESTORAN
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 8, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 140px 140px 100px 140px',
          padding: '12px 20px',
          borderBottom: `1px solid ${'var(--border)'}`,
          fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em',
        }}>
          <span>RESTORAN ADI</span>
          <span>ŞEHİR</span>
          <span>MUTFAK</span>
          <span>DURUM</span>
          <span style={{ textAlign: 'right' }}>İŞLEMLER</span>
        </div>

        {/* Rows */}
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} style={{ height: 52, borderBottom: `1px solid ${'var(--border)'}`, animation: 'pulse 1.5s infinite' }} />
          ))
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            {search ? 'Arama sonucu bulunamadı' : 'Henüz restoran eklenmemiş'}
          </div>
        ) : (
          filtered.map((restaurant) => (
            <div
              key={restaurant.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 140px 140px 100px 140px',
                padding: '14px 20px',
                borderBottom: `1px solid ${'var(--border)'}`,
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--subtle-bg)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {/* Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{restaurant.name}</span>
                {restaurant.is_premium && (
                  <span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', borderRadius: 4 }}>
                    PREMİUM
                  </span>
                )}
                {restaurant.is_featured && (
                  <span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(232,0,13,0.15)', color: 'var(--red)', borderRadius: 4 }}>
                    ÖNE ÇIKAN
                  </span>
                )}
              </div>

              {/* City */}
              <span style={{ fontSize: 12, color: 'var(--dim)' }}>{restaurant.cities?.name || '—'}</span>

              {/* Cuisine */}
              <span style={{ fontSize: 12, color: 'var(--dim)' }}>{restaurant.cuisine_type || '—'}</span>

              {/* Status */}
              <StatusBadge status={restaurant.status} />

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <ActionBtn onClick={() => toggleFeatured(restaurant)} color={restaurant.is_featured ? 'var(--red)' : 'var(--muted)'} title="Öne Çıkar">★</ActionBtn>
                <ActionBtn onClick={() => togglePremium(restaurant)} color={restaurant.is_premium ? '#fbbf24' : 'var(--muted)'} title="Premium">◆</ActionBtn>
                <ActionBtn onClick={() => router.push(`/admin/restaurants/${restaurant.id}`)} color={'var(--dim)'} title="Düzenle">✎</ActionBtn>
                <ActionBtn onClick={() => handleDelete(restaurant.id)} color="#ef4444" disabled={deleting === restaurant.id} title="Sil">✕</ActionBtn>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && (
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
          {filtered.length} restoran gösteriliyor
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
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: 'transparent',
        border: `1px solid ${'var(--border)'}`,
        color, width: 28, height: 28, borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13, display: 'flex', alignItems: 'center',
        justifyContent: 'center', opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.borderColor = color; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      {children}
    </button>
  );
}