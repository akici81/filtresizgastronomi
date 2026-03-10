import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../lib/constants';

export default function Nav({ transparent = false }) {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  const isAdmin = profile?.role === 'superadmin' || profile?.role === 'admin';
  const isEditor = isAdmin || profile?.role === 'editor';

  useEffect(function() {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return function() { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  var menuItems = [
    { label: 'YEMEKLER', href: '/dishes' },
    { label: 'SEHIRLER', href: '/cities' },
    { label: 'RESTORANLAR', href: '/restaurants' },
    { label: 'SEFLER', href: '/chefs' },
  ];

  function handleSignOut() {
    signOut();
    setMenuOpen(false);
    router.push('/');
  }

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      padding: '0 48px',
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: transparent ? 'transparent' : 'rgba(8,8,8,0.95)',
      backdropFilter: transparent ? 'none' : 'blur(20px)',
      borderBottom: transparent ? 'none' : '1px solid ' + COLORS.border,
    }}>
      <div 
        onClick={function() { router.push('/'); }} 
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: '0.08em', color: COLORS.white }}>
          FILTRESIZ
        </span>
        <span style={{ fontSize: 16, fontWeight: 300, color: COLORS.red }}>
          GASTRONOMI
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        {menuItems.map(function(item) {
          return (
            <span
              key={item.href}
              onClick={function() { router.push(item.href); }}
              style={{
                fontSize: 10,
                letterSpacing: '0.12em',
                color: router.pathname === item.href ? COLORS.white : COLORS.dim,
                cursor: 'pointer',
              }}
            >
              {item.label}
            </span>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {user ? (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <div
              onClick={function() { setMenuOpen(!menuOpen); }}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: COLORS.red,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                color: COLORS.white,
              }}
            >
              {(profile?.full_name || profile?.username || 'U')[0].toUpperCase()}
            </div>

            {menuOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: '#141414',
                border: '1px solid ' + COLORS.border,
                borderRadius: 8,
                overflow: 'hidden',
                minWidth: 200,
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid ' + COLORS.border }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.white }}>
                    {profile?.full_name || 'Kullanici'}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                    @{profile?.username || 'user'}
                  </div>
                  <div style={{ fontSize: 9, color: COLORS.red, marginTop: 6, letterSpacing: '0.1em' }}>
                    {profile?.role?.toUpperCase()}
                  </div>
                </div>

                <div
                  onClick={function() { router.push('/profile/' + profile?.username); setMenuOpen(false); }}
                  style={{ padding: '12px 16px', fontSize: 13, color: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <span>Profilim</span>
                </div>

                <div
                  onClick={function() { router.push('/favorites'); setMenuOpen(false); }}
                  style={{ padding: '12px 16px', fontSize: 13, color: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <span>Favorilerim</span>
                </div>

                {(isAdmin || isEditor) && (
                  <div>
                    <div style={{ height: 1, background: COLORS.border }} />
                    <div
                      onClick={function() { router.push('/admin'); setMenuOpen(false); }}
                      style={{ padding: '12px 16px', fontSize: 13, color: COLORS.red, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      <span>Admin Panel</span>
                    </div>
                  </div>
                )}

                <div style={{ height: 1, background: COLORS.border }} />
                <div
                  onClick={handleSignOut}
                  style={{ padding: '12px 16px', fontSize: 13, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <span>Cikis Yap</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={function() { router.push('/login'); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: COLORS.dim,
                fontSize: 11,
                letterSpacing: '0.1em',
                cursor: 'pointer',
                padding: '8px 12px',
              }}
            >
              GIRIS
            </button>
            <button
              onClick={function() { router.push('/register'); }}
              style={{
                background: COLORS.red,
                border: 'none',
                color: COLORS.white,
                fontSize: 10,
                letterSpacing: '0.1em',
                cursor: 'pointer',
                padding: '10px 18px',
                borderRadius: 4,
                fontWeight: 700,
              }}
            >
              KAYIT OL
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
