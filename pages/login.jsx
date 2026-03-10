import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../lib/constants';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Zaten giriş yapmışsa ana sayfaya yönlendir
  if (user) {
    router.push('/');
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(identifier, password);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 400,
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: 40,
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{
              margin: '0 0 8px',
              fontSize: 28,
              fontWeight: 900,
              fontFamily: "'Georgia', serif",
            }}>
              Giriş Yap
            </h1>
            <p style={{ margin: 0, color: COLORS.dim, fontSize: 14 }}>
              Hesabına giriş yap ve keşfetmeye devam et
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 6,
              color: '#ef4444',
              fontSize: 13,
              marginBottom: 24,
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Input
              label="E-posta veya Kullanıcı Adı"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ornek@email.com veya kullaniciadi"
              required
            />

            <Input
              label="Şifre"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: 24,
            }}>
              <span
                onClick={() => router.push('/forgot-password')}
                style={{
                  fontSize: 12,
                  color: COLORS.red,
                  cursor: 'pointer',
                }}
              >
                Şifremi Unuttum
              </span>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={!identifier || !password}
            >
              GİRİŞ YAP
            </Button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            margin: '32px 0',
          }}>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
            <span style={{ fontSize: 12, color: COLORS.muted }}>veya</span>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          </div>

          {/* Register Link */}
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 14, color: COLORS.dim }}>
              Hesabın yok mu?{' '}
            </span>
            <span
              onClick={() => router.push('/register')}
              style={{
                fontSize: 14,
                color: COLORS.red,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Kayıt Ol
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
}