import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../lib/constants';

export default function Nav({ transparent = false }) {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef();

  const isAdmin = profile?.role === 'superadmin' || profile?.role === 'admin';
  const isStaff = isAdmin || profile?.role === 'editor' || profile?.role === 'author' || profile?.role === 'moderator';

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!transparent) return;
    function handleScroll() { setScrolled(window.scrollY > 40); }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [transparent]);

  const menuItems = [
    { label: 'YEMEKLER',    href: '/dishes' },
    { label: 'ŞEHİRLER',   href: '/cities' },
    { label: 'RESTORANLAR', href: '/restaurants' },
    { label: 'ŞEFLER',      href: '/chefs' },
    { label: 'MAKALELER',   href: '/articles' },
  ];

  const isTransparent = transparent && !scrolled;

  function handleSignOut() {
    signOut();
    setMenuOpen(false);
    router.push('/');
  }

  const avatarLetter = (profile?.full_name || profile?.username || 'U')[0].toUpperCase();

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '0 48px', height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: isTransparent ? 'transparent' : 'rgba(8,8,8,0.95)',
      backdropFilter: isTransparent ? 'none' : 'blur(20px)',
      borderBottom: isTransparent ? 'none' : `1px solid ${COLORS.border}`,
      transition: 'background 0.3s, border-color 0.3s',
    }}>
      {/* Logo */}
      <div onClick={() => router.push('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: '0.08em', color: COLORS.white }}>FİLTRESİZ</span>
        <span style={{ fontSize: 16, fontWeight: 300, color: COLORS.red }}>GASTRONOMİ</span>
      </div>

      {/* Menü Linkleri */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {menuItems.map(item => (
          <span
            key={item.href}
            onClick={() => router.push(item.href)}
            style={{
              fontSize: 10, letterSpacing: '0.12em', cursor: 'pointer',
              color: router.pathname === item.href ? COLORS.white : COLORS.dim,
              borderBottom: router.pathname === item.href ? `1px solid ${COLORS.red}` : '1px solid transparent',
              paddingBottom: 2, transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.target.style.color = COLORS.white}
            onMouseLeave={e => e.target.style.color = router.pathname === item.href ? COLORS.white : COLORS.dim}
          >
            {item.label}
          </span>
        ))}
      </div>

      {/* Sağ Alan */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {user ? (
          <div ref={menuRef} style={{ position: 'relative' }}>
            {/* Avatar */}
            <div
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: profile?.avatar_url ? 'transparent' : COLORS.red,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 14, fontWeight: 700, color: COLORS.white,
                overflow: 'hidden', border: `2px solid ${menuOpen ? COLORS.red : 'transparent'}`,
                transition: 'border-color 0.15s',
              }}
            >
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : avatarLetter}
            </div>

            {/* Dropdown */}
            {menuOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                background: '#141414', border: `1px solid ${COLORS.border}`,
                borderRadius: 10, overflow: 'hidden', minWidth: 210,
                boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
              }}>
                {/* Kullanıcı Bilgisi */}
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${COLORS.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: COLORS.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                      {profile?.avatar_url
                        ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : avatarLetter}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.white }}>{profile?.full_name || 'Kullanıcı'}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>@{profile?.username || 'user'}</div>
                    </div>
                  </div>
                  {profile?.role && (
                    <div style={{ marginTop: 8, fontSize: 9, color: COLORS.red, letterSpacing: '0.1em', fontWeight: 700 }}>
                      {profile.role === 'superadmin' ? 'SÜPER ADMİN' :
                       profile.role === 'admin' ? 'ADMİN' :
                       profile.role === 'editor' ? 'EDİTÖR' :
                       profile.role === 'author' ? 'YAZAR' :
                       profile.role === 'moderator' ? 'MODERATÖR' : 'ÜYE'}
                    </div>
                  )}
                </div>

                {/* Menü İtemleri */}
                <DropdownItem icon="👤" label="Profilim" onClick={() => { router.push(`/profil/${profile?.username}`); setMenuOpen(false); }} />
                <DropdownItem icon="♥" label="Favorilerim" onClick={() => { router.push('/favorites'); setMenuOpen(false); }} />
                <DropdownItem icon="⚙️" label="Hesap Ayarları" onClick={() => { router.push('/hesap'); setMenuOpen(false); }} />

                {isStaff && (
                  <>
                    <div style={{ height: 1, background: COLORS.border }} />
                    <DropdownItem icon="🛠" label="Admin Panel" onClick={() => { router.push('/admin'); setMenuOpen(false); }} color={COLORS.red} />
                  </>
                )}

                <div style={{ height: 1, background: COLORS.border }} />
                <DropdownItem icon="🚪" label="Çıkış Yap" onClick={handleSignOut} color="#ef4444" />
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => router.push('/login')}
              style={{ background: 'transparent', border: 'none', color: COLORS.dim, fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer', padding: '8px 12px' }}
            >
              GİRİŞ
            </button>
            <button
              onClick={() => router.push('/register')}
              style={{ background: COLORS.red, border: 'none', color: COLORS.white, fontSize: 10, letterSpacing: '0.1em', cursor: 'pointer', padding: '10px 18px', borderRadius: 4, fontWeight: 700 }}
            >
              KAYIT OL
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

function DropdownItem({ icon, label, onClick, color }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '11px 16px', fontSize: 13,
        color: color || (hover ? COLORS.white : 'rgba(255,255,255,0.75)'),
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        background: hover ? 'rgba(255,255,255,0.04)' : 'transparent',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      {label}
    </div>
  );
}