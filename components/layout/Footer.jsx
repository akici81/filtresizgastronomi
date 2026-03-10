import { useRouter } from 'next/router';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { COLORS } from '../../lib/constants';

export default function Footer() {
  const router = useRouter();
  const { settings } = useSiteSettings();

  return (
    <footer style={{
      background: COLORS.bg,
      borderTop: '1px solid ' + COLORS.border,
      padding: '64px 48px 32px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 48,
          marginBottom: 48,
        }}>
          <div>
            <div 
              onClick={function() { router.push('/'); }} 
              style={{ cursor: 'pointer', marginBottom: 16 }}
            >
              <span style={{ 
                fontSize: 18, 
                fontWeight: 900, 
                letterSpacing: '0.1em', 
                color: COLORS.white,
              }}>
                FILTRESIZ
              </span>
              <span style={{ 
                fontSize: 18, 
                fontWeight: 300, 
                color: COLORS.red,
                marginLeft: 8,
              }}>
                GASTRONOMI
              </span>
            </div>
            <p style={{ 
              fontSize: 13, 
              color: COLORS.dim, 
              lineHeight: 1.7, 
              maxWidth: 280,
              margin: 0,
            }}>
              Turkiyenin gastronomi hafizasi.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: 11, letterSpacing: '0.15em', color: COLORS.red, marginBottom: 20, marginTop: 0 }}>KESFET</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span onClick={function() { router.push('/dishes'); }} style={{ fontSize: 13, color: COLORS.dim, cursor: 'pointer' }}>Yemekler</span>
              <span onClick={function() { router.push('/cities'); }} style={{ fontSize: 13, color: COLORS.dim, cursor: 'pointer' }}>Sehirler</span>
              <span onClick={function() { router.push('/restaurants'); }} style={{ fontSize: 13, color: COLORS.dim, cursor: 'pointer' }}>Restoranlar</span>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 11, letterSpacing: '0.15em', color: COLORS.red, marginBottom: 20, marginTop: 0 }}>TOPLULUK</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span onClick={function() { router.push('/articles'); }} style={{ fontSize: 13, color: COLORS.dim, cursor: 'pointer' }}>Yazilar</span>
              <span onClick={function() { router.push('/register'); }} style={{ fontSize: 13, color: COLORS.dim, cursor: 'pointer' }}>Kayit Ol</span>
              <span onClick={function() { router.push('/login'); }} style={{ fontSize: 13, color: COLORS.dim, cursor: 'pointer' }}>Giris Yap</span>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 11, letterSpacing: '0.15em', color: COLORS.red, marginBottom: 20, marginTop: 0 }}>KURUMSAL</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span onClick={function() { router.push('/about'); }} style={{ fontSize: 13, color: COLORS.dim, cursor: 'pointer' }}>Hakkimizda</span>
              <span onClick={function() { router.push('/contact'); }} style={{ fontSize: 13, color: COLORS.dim, cursor: 'pointer' }}>Iletisim</span>
              <span onClick={function() { router.push('/privacy'); }} style={{ fontSize: 13, color: COLORS.dim, cursor: 'pointer' }}>Gizlilik</span>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 24,
          borderTop: '1px solid ' + COLORS.border,
        }}>
          <div style={{ fontSize: 12, color: COLORS.muted }}>
            2025 Filtresiz Gastronomi
          </div>
        </div>
      </div>
    </footer>
  );
}
