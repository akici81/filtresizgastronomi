import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import { supabase } from '../../../lib/supabase';
import { COLORS, USER_ROLES } from '../../../lib/constants';

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  async function fetchUsers() {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('id, email, username, full_name, role, is_active, is_verified, reviews_count, favorites_count, created_at')
      .order('created_at', { ascending: false });

    if (roleFilter !== 'all') query = query.eq('role', roleFilter);
    const { data } = await query;
    setUsers(data || []);
    setLoading(false);
  }

  async function toggleActive(user) {
    await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id);
    setUsers(users.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
  }

  async function changeRole(userId, role) {
    await supabase.from('profiles').update({ role }).eq('id', userId);
    setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
  }

  const filtered = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Kullanıcılar">
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="İsim, kullanıcı adı veya e-posta ara..."
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
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            background: 'var(--subtle-bg)',
            border: `1px solid ${'var(--border)'}`,
            borderRadius: 6, padding: '10px 14px',
            color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="all">Tüm Roller</option>
          {Object.entries(USER_ROLES).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 140px 120px 80px 80px 140px',
          padding: '12px 20px',
          borderBottom: `1px solid ${'var(--border)'}`,
          fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em',
        }}>
          <span>KULLANICI</span>
          <span>ROL</span>
          <span>DURUM</span>
          <span>YORUM</span>
          <span>FAVORİ</span>
          <span style={{ textAlign: 'right' }}>İŞLEMLER</span>
        </div>

        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} style={{ height: 60, borderBottom: `1px solid ${'var(--border)'}`, animation: 'pulse 1.5s infinite' }} />
          ))
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            {search ? 'Arama sonucu bulunamadı' : 'Henüz kullanıcı yok'}
          </div>
        ) : (
          filtered.map((user) => (
            <div
              key={user.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 140px 120px 80px 80px 140px',
                padding: '14px 20px',
                borderBottom: `1px solid ${'var(--border)'}`,
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--subtle-bg)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {/* User Info */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {user.full_name || user.username || 'İsimsiz'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  @{user.username} · {user.email}
                </div>
              </div>

              {/* Role - inline editable */}
              <select
                value={user.role}
                onChange={(e) => changeRole(user.id, e.target.value)}
                style={{
                  background: 'var(--subtle-bg)',
                  border: `1px solid ${'var(--border)'}`,
                  borderRadius: 4, padding: '4px 8px',
                  color: 'var(--text)', fontSize: 11,
                  outline: 'none', cursor: 'pointer',
                }}
              >
                {Object.entries(USER_ROLES).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>

              {/* Active Status */}
              <div onClick={() => toggleActive(user)} style={{ cursor: 'pointer' }}>
                <span style={{
                  fontSize: 10, padding: '3px 8px', borderRadius: 4,
                  background: user.is_active ? '#10b98122' : '#ef444422',
                  color: user.is_active ? '#10b981' : '#ef4444',
                  letterSpacing: '0.05em',
                }}>
                  {user.is_active ? 'Aktif' : 'Pasif'}
                </span>
              </div>

              {/* Stats */}
              <span style={{ fontSize: 12, color: 'var(--dim)' }}>{user.reviews_count || 0}</span>
              <span style={{ fontSize: 12, color: 'var(--dim)' }}>{user.favorites_count || 0}</span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <ActionBtn
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                  color={'var(--dim)'} title="Detay"
                >
                  ✎
                </ActionBtn>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && (
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
          {filtered.length} kullanıcı gösteriliyor
        </div>
      )}
    </AdminLayout>
  );
}

function ActionBtn({ children, onClick, color, disabled, title }) {
  return (
    <button
      onClick={onClick} disabled={disabled} title={title}
      style={{
        background: 'transparent', border: `1px solid ${'var(--border)'}`,
        color, width: 28, height: 28, borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13, display: 'flex', alignItems: 'center',
        justifyContent: 'center', opacity: disabled ? 0.5 : 1, transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.borderColor = color; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      {children}
    </button>
  );
}