import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../lib/constants';

// Sayfa → gerekli rol tanımları
const PAGE_ACCESS = {
  '/admin':                   ['superadmin', 'admin', 'editor', 'author', 'moderator'],
  '/admin/homepage':          ['superadmin', 'admin'],
  '/admin/dishes':            ['superadmin', 'admin', 'editor'],
  '/admin/restaurants':       ['superadmin', 'admin', 'editor'],
  '/admin/cities':            ['superadmin', 'admin'],
  '/admin/chefs':             ['superadmin', 'admin', 'editor'],
  '/admin/articles':          ['superadmin', 'admin', 'editor', 'author'],
  '/admin/users':             ['superadmin', 'admin'],
  '/admin/settings':          ['superadmin', 'admin'],
  '/admin/permissions':       ['superadmin'],
};

// Sidebar menü — her item için hangi roller görebilir
const NAV_ITEMS = [
  { label: 'Dashboard',    href: '/admin',             icon: '▦',   roles: ['superadmin','admin','editor','author','moderator'] },
  { label: 'Ana Sayfa',    href: '/admin/homepage',    icon: '⌂',   roles: ['superadmin','admin'] },
  { label: 'Yemekler',     href: '/admin/dishes',      icon: '🍽',  roles: ['superadmin','admin','editor'] },
  { label: 'Restoranlar',  href: '/admin/restaurants', icon: '🏪',  roles: ['superadmin','admin','editor'] },
  { label: 'Şehirler',     href: '/admin/cities',      icon: '🗺',  roles: ['superadmin','admin'] },
  { label: 'Şefler',       href: '/admin/chefs',       icon: '👨‍🍳', roles: ['superadmin','admin','editor'] },
  { label: 'Makaleler',    href: '/admin/articles',    icon: '📝',  roles: ['superadmin','admin','editor','author'] },
  { label: 'Kullanıcılar', href: '/admin/users',       icon: '👥',  roles: ['superadmin','admin'] },
  { label: 'Yetkiler',     href: '/admin/permissions', icon: '🔐',  roles: ['superadmin'] },
  { label: 'Ayarlar',      href: '/admin/settings',    icon: '⚙',  roles: ['superadmin','admin'] },
];

const ROLE_LABELS = {
  superadmin: 'Süper Admin',
  admin: 'Admin',
  editor: 'Editör',
  author: 'Yazar',
  moderator: 'Moderatör',
  user: 'Kullanıcı',
};

export default function AdminLayout({ children, title = 'Admin Panel' }) {
  const router = useRouter();
  const { user, profile, loading, signOut, role } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Giriş yapmamış → login
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }

    // Profil yüklendi, normal kullanıcı → anasayfaya
    if (profile) {
      const staffRoles = ['superadmin', 'admin', 'editor', 'author', 'moderator'];
      if (!staffRoles.includes(profile.role)) {
        router.push('/');
        return;
      }

      // Sayfa erişim kontrolü
      const currentBase = '/' + router.pathname.split('/').slice(1, 3).join('/');
      const allowed = PAGE_ACCESS[currentBase] || PAGE_ACCESS[router.pathname];
      if (allowed && !allowed.includes(profile.role)) {
        // Yetkisiz sayfa → admin dashboard'a yönlendir
        router.push('/admin');
        return;
      }
    }
  }, [user, profile, loading, router.pathname]);

  // Loading
  if (loading || !user || !profile) {
    return (
      <div style={{ background: COLORS.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ width: 36, height: 36, border: `2px solid ${COLORS.red}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ fontSize: 12, color: COLORS.muted, letterSpacing: '0.1em' }}>YÜKLENİYOR...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const staffRoles = ['superadmin', 'admin', 'editor', 'author', 'moderator'];
  if (!staffRoles.includes(profile.role)) return null;

  // Role göre menü filtrele
  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(profile.role));

  const isActive = (href) => {
    if (href === '/admin') return router.pathname === '/admin';
    return router.pathname.startsWith(href);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.bg, color: COLORS.white }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#0d0d0d', borderRight: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 }}>
        <div style={{ padding: '24px 20px', borderBottom: `1px solid ${COLORS.border}` }}>
          <div onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
            <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.1em' }}>FİLTRESİZ</span>
            <span style={{ fontSize: 13, fontWeight: 300, color: COLORS.red, marginLeft: 6 }}>ADMIN</span>
          </div>
          <div style={{ fontSize: 10, color: COLORS.red, marginTop: 4, letterSpacing: '0.05em', fontWeight: 700 }}>
            {ROLE_LABELS[profile.role] || profile.role?.toUpperCase()}
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {visibleNav.map((item) => (
            <div
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px', fontSize: 13, cursor: 'pointer',
                color: isActive(item.href) ? COLORS.white : COLORS.dim,
                background: isActive(item.href) ? 'rgba(232,0,13,0.1)' : 'transparent',
                borderLeft: isActive(item.href) ? `2px solid ${COLORS.red}` : '2px solid transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isActive(item.href)) e.currentTarget.style.color = COLORS.white; }}
              onMouseLeave={e => { if (!isActive(item.href)) e.currentTarget.style.color = COLORS.dim; }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 13, color: COLORS.white, marginBottom: 2 }}>
            {profile.full_name || profile.username}
          </div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 12 }}>
            {profile.email}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div onClick={() => router.push('/')} style={{ fontSize: 12, color: COLORS.dim, cursor: 'pointer' }}>
              Siteye Dön
            </div>
            <div onClick={() => { signOut(); router.push('/'); }} style={{ fontSize: 12, color: '#ef4444', cursor: 'pointer' }}>
              Çıkış
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh' }}>
        <div style={{ padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${COLORS.border}`, background: '#0d0d0d', position: 'sticky', top: 0, zIndex: 40 }}>
          <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h1>
        </div>
        <div style={{ padding: 32 }}>
          {children}
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}