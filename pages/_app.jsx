import '../styles/globals.css';
import { AuthProvider } from '../hooks/useAuth';
import { ThemeProvider } from '../lib/ThemeContext';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ThemeProvider>
  );
}