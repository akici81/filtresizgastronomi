import Nav from './Nav';
import Footer from './Footer';
export default function Layout({ 
  children, 
  transparentNav = false,
  hideFooter = false,
}) {
  return (
    <div style={{ 
      background: 'var(--bg)', 
      minHeight: '100vh',
      color: 'var(--text)',
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