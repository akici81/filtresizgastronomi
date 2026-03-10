import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import { supabase } from '../../../lib/supabase';
import { COLORS } from '../../../lib/constants';

export default function AdminCities() {
  const router = useRouter();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  const REGIONS = ['Marmara', 'Ege', 'Akdeniz', 'İç Anadolu', 'Karadeniz', 'Doğu Anadolu', 'Güneydoğu Anadolu'];

  useEffect(() => { fetchCities(); }, [regionFilter]);

  async function fetchCities() {
    setLoading(true);
    let query = supabase
      .from('cities')
      .select('id, name, slug, region, is_active, is_featured, created_at')
      .order('name');

    if (regionFilter !== 'all') query = query.eq('region', regionFilter);

    const { data } = await query;
    setCities(data || []);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm('Bu şehri silmek istediğinize emin misiniz?')) return;
    setDeleting(id);
    await supabase.from('cities').delete().eq('id', id);
    setCities(cities.filter(c => c.id !== id));
    setDeleting(null);
  }

  async function toggleFeatured(city) {
    await supabase.from('cities').update({ is_featured: !city.is_featured }).eq('id', city.id);
    setCities(cities.map(c => c.id === city.id ? { ...c, is_featured: !c.is_featured } : c));
  }

  async function toggleActive(city) {
    await supabase.from('cities').update({ is_active: !city.is_active }).eq('id', city.id);
    setCities(cities.map(c => c.id === city.id ? { ...c, is_active: !c.is_active } : c));
  }

  const filtered = cities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Şehirler">
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Şehir ara..."
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
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
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
          <option value="all">Tüm Bölgeler</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <button
          onClick={() => router.push('/admin/cities/new')}
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
          + YENİ ŞEHİR
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
          gridTemplateColumns: '1fr 160px 100px 100px 120px',
          padding: '12px 20px',
          borderBottom: `1px solid ${COLORS.border}`,
          fontSize: 11,
          color: COLORS.muted,
          letterSpacing: '0.08em',
        }}>
          <span>ŞEHİR ADI</span>
          <span>BÖLGE</span>
          <span>DURUM</span>
          <span>ÖNE ÇIKAN</span>
          <span style={{ textAlign: 'right' }}>İŞLEMLER</span>
        </div>

        {/* Rows */}
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} style={{
              height: 52,
              borderBottom: `1px solid ${COLORS.border}`,
              animation: 'pulse 1.5s infinite',
            }} />
          ))
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>
            {search ? 'Arama sonucu bulunamadı' : 'Henüz şehir eklenmemiş'}
          </div>
        ) : (
          filtered.map((city) => (
            <div
              key={city.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 160px 100px 100px 120px',
                padding: '14px 20px',
                borderBottom: `1px solid ${COLORS.border}`,
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {/* Name */}
              <div style={{ fontSize: 14, fontWeight: 600 }}>{city.name}</div>

              {/* Region */}
              <span style={{ fontSize: 12, color: COLORS.dim }}>{city.region || '—'}</span>

              {/* Active */}
              <div
                onClick={() => toggleActive(city)}
                style={{ cursor: 'pointer' }}
              >
                <span style={{
                  fontSize: 10,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: city.is_active ? '#10b98122' : '#6b728022',
                  color: city.is_active ? '#10b981' : '#6b7280',
                  letterSpacing: '0.05em',
                }}>
                  {city.is_active ? 'Aktif' : 'Pasif'}
                </span>
              </div>

              {/* Featured */}
              <div
                onClick={() => toggleFeatured(city)}
                style={{ cursor: 'pointer' }}
              >
                <span style={{
                  fontSize: 10,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: city.is_featured ? '#fbbf2422' : 'transparent',
                  color: city.is_featured ? '#fbbf24' : COLORS.muted,
                  border: `1px solid ${city.is_featured ? '#fbbf2440' : COLORS.border}`,
                  letterSpacing: '0.05em',
                }}>
                  {city.is_featured ? '★ Evet' : '☆ Hayır'}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <ActionBtn
                  onClick={() => router.push(`/admin/cities/${city.id}`)}
                  color={COLORS.dim}
                  title="Düzenle"
                >
                  ✎
                </ActionBtn>
                <ActionBtn
                  onClick={() => handleDelete(city.id)}
                  color="#ef4444"
                  disabled={deleting === city.id}
                  title="Sil"
                >
                  ✕
                </ActionBtn>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && (
        <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 12 }}>
          {filtered.length} şehir gösteriliyor
        </div>
      )}
    </AdminLayout>
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