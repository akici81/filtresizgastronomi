import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    dishes: 0, restaurants: 0, cities: 0, chefs: 0,
    articles: 0, users: 0, reviews: 0, pendingReviews: 0,
  });
  const [recentDishes, setRecentDishes] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const [
      dishCount, restCount, cityCount, chefCount,
      articleCount, userCount, reviewCount, pendingCount,
      dishes, users,
    ] = await Promise.all([
      supabase.from('dishes').select('id', { count: 'exact', head: true }),
      supabase.from('restaurants').select('id', { count: 'exact', head: true }),
      supabase.from('cities').select('id', { count: 'exact', head: true }),
      supabase.from('chefs').select('id', { count: 'exact', head: true }),
      supabase.from('articles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('is_approved', false),
      supabase.from('dishes').select('id, name, status, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('id, full_name, username, role, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    setStats({
      dishes: dishCount.count || 0,
      restaurants: restCount.count || 0,
      cities: cityCount.count || 0,
      chefs: chefCount.count || 0,
      articles: articleCount.count || 0,
      users: userCount.count || 0,
      reviews: reviewCount.count || 0,
      pendingReviews: pendingCount.count || 0,
    });
    setRecentDishes(dishes.data || []);
    setRecentUsers(users.data || []);
    setLoading(false);
  }

  const statCards = [
    { label: 'Yemekler', value: stats.dishes, href: '/admin/dishes', color: 'var(--red)' },
    { label: 'Restoranlar', value: stats.restaurants, href: '/admin/restaurants', color: '#3b82f6' },
    { label: 'Şehirler', value: stats.cities, href: '/admin/cities', color: '#10b981' },
    { label: 'Şefler', value: stats.chefs, href: '/admin/chefs', color: '#f59e0b' },
    { label: 'Makaleler', value: stats.articles, href: '/admin/articles', color: '#8b5cf6' },
    { label: 'Kullanıcılar', value: stats.users, href: '/admin/users', color: '#06b6d4' },
    { label: 'Değerlendirmeler', value: stats.reviews, href: '/admin/reviews', color: '#84cc16' },
    { label: 'Bekleyen Yorum', value: stats.pendingReviews, href: '/admin/reviews', color: '#f97316' },
  ];

  return (
    <AdminLayout title="Dashboard">
      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 40,
      }}>
        {statCards.map((card) => (
          <div
            key={card.label}
            onClick={() => router.push(card.href)}
            style={{
              background: 'var(--card)',
              border: `1px solid ${'var(--border)'}`,
              borderRadius: 8,
              padding: '20px 24px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              borderTop: `3px solid ${card.color}`,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--card-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--card)'}
          >
            <div style={{ fontSize: 28, fontWeight: 900, color: card.color, marginBottom: 6 }}>
              {loading ? '—' : card.value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--dim)', letterSpacing: '0.05em' }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Two Column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent Dishes */}
        <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${'var(--border)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Son Eklenen Yemekler</span>
            <span
              onClick={() => router.push('/admin/dishes')}
              style={{ fontSize: 11, color: 'var(--red)', cursor: 'pointer' }}
            >
              Tümü →
            </span>
          </div>
          {loading ? (
            <div style={{ padding: 20 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ height: 16, background: 'var(--border)', borderRadius: 4, marginBottom: 12, opacity: 0.5 }} />
              ))}
            </div>
          ) : recentDishes.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Henüz yemek eklenmemiş
            </div>
          ) : (
            recentDishes.map((dish) => (
              <div
                key={dish.id}
                onClick={() => router.push(`/admin/dishes/${dish.id}`)}
                style={{
                  padding: '12px 20px',
                  borderBottom: `1px solid ${'var(--border)'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--subtle-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 13 }}>{dish.name}</span>
                <StatusBadge status={dish.status} />
              </div>
            ))
          )}
        </div>

        {/* Recent Users */}
        <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${'var(--border)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Son Kayıt Olan Kullanıcılar</span>
            <span
              onClick={() => router.push('/admin/users')}
              style={{ fontSize: 11, color: 'var(--red)', cursor: 'pointer' }}
            >
              Tümü →
            </span>
          </div>
          {loading ? (
            <div style={{ padding: 20 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ height: 16, background: 'var(--border)', borderRadius: 4, marginBottom: 12, opacity: 0.5 }} />
              ))}
            </div>
          ) : recentUsers.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Henüz kullanıcı yok
            </div>
          ) : (
            recentUsers.map((u) => (
              <div
                key={u.id}
                onClick={() => router.push(`/admin/users/${u.id}`)}
                style={{
                  padding: '12px 20px',
                  borderBottom: `1px solid ${'var(--border)'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--subtle-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <div style={{ fontSize: 13 }}>{u.full_name || u.username || 'İsimsiz'}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>@{u.username}</div>
                </div>
                <RoleBadge role={u.role} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 16 }}>
          HIZLI İŞLEMLER
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: '+ Yemek Ekle', href: '/admin/dishes/new' },
            { label: '+ Restoran Ekle', href: '/admin/restaurants/new' },
            { label: '+ Şehir Ekle', href: '/admin/cities/new' },
            { label: '+ Makale Ekle', href: '/admin/articles/new' },
            { label: '+ Şef Ekle', href: '/admin/chefs/new' },
          ].map((action) => (
            <button
              key={action.href}
              onClick={() => router.push(action.href)}
              style={{
                background: 'transparent',
                border: `1px solid ${'var(--border)'}`,
                color: 'var(--dim)',
                padding: '10px 20px',
                fontSize: 12,
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--red)';
                e.currentTarget.style.color = 'var(--text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--dim)';
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

function StatusBadge({ status }) {
  const map = {
    published: { label: 'Yayında', color: '#10b981' },
    draft: { label: 'Taslak', color: '#f59e0b' },
    pending: { label: 'Bekliyor', color: '#3b82f6' },
    archived: { label: 'Arşiv', color: 'var(--muted)' },
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

function RoleBadge({ role }) {
  const map = {
    superadmin: { label: 'Süper Admin', color: 'var(--red)' },
    admin: { label: 'Admin', color: '#f97316' },
    editor: { label: 'Editör', color: '#8b5cf6' },
    author: { label: 'Yazar', color: '#3b82f6' },
    moderator: { label: 'Moderatör', color: '#10b981' },
    user: { label: 'Kullanıcı', color: 'var(--muted)' },
  };
  const r = map[role] || map.user;
  return (
    <span style={{
      fontSize: 10,
      padding: '3px 8px',
      borderRadius: 4,
      background: `${r.color}22`,
      color: r.color,
    }}>
      {r.label}
    </span>
  );
}