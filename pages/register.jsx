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
  const [needsVerification, setNeedsVerification] = useState(false);

  if (user) {
    router.push('/');
    return null;
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(''); // kullanıcı yazmaya başlayınca hata kaybolsun
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

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
      const result = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.username
      );

      // Supabase e-posta doğrulama açıksa → doğrulama mesajı göster
      if (result?.user && !result.user.email_confirmed_at) {
        setNeedsVerification(true);
      } else {
        // Doğrulama kapalıysa (geliştirme ortamı) → direkt giriş yapılmış olur
        setSuccess(true);
        setTimeout(() => router.push('/'), 1500);
      }
    } catch (err) {
      // Hata mesajlarını Türkçeleştir
      const msg = err.message || '';
      if (msg.includes('already registered') || msg.includes('already exists')) {
        setError('Bu e-posta adresi zaten kayıtlı');
      } else if (msg.includes('kullanıcı adı')) {
        setError(msg);
      } else if (msg.includes('Password')) {
        setError('Şifre en az 6 karakter olmalıdır');
      } else if (msg.includes('email')) {
        setError('Geçerli bir e-posta adresi girin');
      } else {
        setError(msg || 'Kayıt yapılamadı. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  }

  // E-posta doğrulama gerekiyor
  if (needsVerification) {
    return (
      <Layout>
        <div style={styles.centerWrap}>
          <div style={styles.card}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>📬</div>
            <h1 style={styles.title}>E-postanı Doğrula</h1>
            <p style={{ margin: '0 0 12px', color: COLORS.dim, fontSize: 14, lineHeight: 1.7 }}>
              <strong style={{ color: COLORS.white }}>{formData.email}</strong> adresine bir doğrulama bağlantısı gönderdik.
            </p>
            <p style={{ margin: '0 0 32px', color: COLORS.muted, fontSize: 13, lineHeight: 1.6 }}>
              Bağlantıya tıkladıktan sonra hesabın aktif olacak. Spam klasörünü de kontrol etmeyi unutma.
            </p>
            <Button onClick={() => router.push('/login')}>GİRİŞ SAYFASINA GİT</Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Kayıt başarılı (doğrulama kapalı ortam)
  if (success) {
    return (
      <Layout>
        <div style={styles.centerWrap}>
          <div style={{ ...styles.card, textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
            <h1 style={styles.title}>Hoş Geldin!</h1>
            <p style={{ color: COLORS.dim, fontSize: 14 }}>Hesabın oluşturuldu, yönlendiriliyorsun...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.centerWrap}>
        <div style={styles.card}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={styles.title}>Kayıt Ol</h1>
            <p style={{ margin: 0, color: COLORS.dim, fontSize: 14 }}>
              Gastronomi topluluğuna katıl
            </p>
          </div>

          {/* Hata mesajı */}
          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#ef4444', fontSize: 13, marginBottom: 24 }}>
              {error}
            </div>
          )}

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

            <p style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.6, marginBottom: 24 }}>
              Kayıt olarak{' '}
              <span onClick={() => router.push('/terms')} style={{ color: COLORS.red, cursor: 'pointer' }}>Kullanım Şartları</span>
              {'\'nı ve '}
              <span onClick={() => router.push('/privacy')} style={{ color: COLORS.red, cursor: 'pointer' }}>Gizlilik Politikası</span>
              {'\'nı kabul etmiş olursunuz.'}
            </p>

            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={!formData.email || !formData.password || !formData.username || !formData.fullName}
            >
              KAYIT OL
            </Button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '28px 0' }}>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
            <span style={{ fontSize: 12, color: COLORS.muted }}>veya</span>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 14, color: COLORS.dim }}>Zaten hesabın var mı? </span>
            <span onClick={() => router.push('/login')} style={{ fontSize: 14, color: COLORS.red, cursor: 'pointer', fontWeight: 600 }}>
              Giriş Yap
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  centerWrap: {
    minHeight: 'calc(100vh - 60px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 40,
  },
  title: {
    margin: '0 0 8px',
    fontSize: 28,
    fontWeight: 900,
    fontFamily: "'Georgia', serif",
  },
};