import Nav from './Nav';
import Footer from './Footer';
import { COLORS } from '../../lib/constants';

export default function Layout({ 
  children, 
  transparentNav = false,
  hideFooter = false,
}) {
  return (
    <div style={{ 
      background: COLORS.bg, 
      minHeight: '100vh',
      color: COLORS.white,
      fontFamily: "system-ui, sans-serif",
    }}>
      <Nav transparent={transparentNav} />
      <main style={{ paddingTop: transparentNav ? 0 : 60 }}>
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}