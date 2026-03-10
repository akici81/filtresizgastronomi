import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../lib/constants';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Zaten giriş yapmışsa ana sayfaya yönlendir
  if (user) {
    router.push('/');
    return null;
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Validasyonlar
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (formData.username.length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalıdır');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir');
      return;
    }

    setLoading(true);

    try {
      await signUp(formData.email, formData.password, formData.fullName, formData.username);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Kayıt yapılamadı. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
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
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
            <h1 style={{
              margin: '0 0 16px',
              fontSize: 24,
              fontWeight: 900,
              fontFamily: "'Georgia', serif",
            }}>
              Kayıt Başarılı!
            </h1>
            <p style={{
              margin: '0 0 32px',
              color: COLORS.dim,
              fontSize: 14,
              lineHeight: 1.6,
            }}>
              E-posta adresine bir doğrulama linki gönderdik.
              Lütfen e-postanı kontrol et ve hesabını doğrula.
            </p>
            <Button onClick={() => router.push('/login')}>
              GİRİŞ SAYFASINA GİT
            </Button>
          </div>
        </div>
      </Layout>
    );
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
          maxWidth: 440,
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
              Kayıt Ol
            </h1>
            <p style={{ margin: 0, color: COLORS.dim, fontSize: 14 }}>
              Gastronomi topluluğuna katıl
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
              label="Ad Soyad"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Ahmet Yılmaz"
              required
            />

            <Input
              label="Kullanıcı Adı"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="ahmetyilmaz"
              required
            />

            <Input
              label="E-posta"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ornek@email.com"
              required
            />

            <Input
              label="Şifre"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="En az 6 karakter"
              required
            />

            <Input
              label="Şifre Tekrar"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Şifrenizi tekrar girin"
              required
            />

            {/* Terms */}
            <p style={{
              fontSize: 12,
              color: COLORS.muted,
              lineHeight: 1.6,
              marginBottom: 24,
            }}>
              Kayıt olarak{' '}
              <span
                onClick={() => router.push('/terms')}
                style={{ color: COLORS.red, cursor: 'pointer' }}
              >
                Kullanım Şartları
              </span>
              'nı ve{' '}
              <span
                onClick={() => router.push('/privacy')}
                style={{ color: COLORS.red, cursor: 'pointer' }}
              >
                Gizlilik Politikası
              </span>
              'nı kabul etmiş olursunuz.
            </p>

            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={!formData.email || !formData.password || !formData.username}
            >
              KAYIT OL
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

          {/* Login Link */}
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 14, color: COLORS.dim }}>
              Zaten hesabın var mı?{' '}
            </span>
            <span
              onClick={() => router.push('/login')}
              style={{
                fontSize: 14,
                color: COLORS.red,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Giriş Yap
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
}