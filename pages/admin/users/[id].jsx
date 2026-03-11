import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import { supabase } from '../../../lib/supabase';
import { COLORS, USER_ROLES } from '../../../lib/constants';

export default function UserDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { if (id) fetchUser(); }, [id]);

  async function fetchUser() {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (data) {
      setUser(data);
      setForm({
        full_name: data.full_name || '',
        username: data.username || '',
        bio: data.bio || '',
        role: data.role || 'user',
        is_active: data.is_active ?? true,
        is_verified: data.is_verified ?? false,
        website: data.website || '',
        instagram: data.instagram || '',
        twitter: data.twitter || '',
      });
    }
    setLoading(false);
  }

  function handleChange(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setError('');
    setSuccess('');
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update(form)
      .eq('id', id);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Kaydedildi!');
      fetchUser();
    }
    setSaving(false);
  }

  if (loading) return (
    <AdminLayout title="Kullanıcı">
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Yükleniyor...</div>
    </AdminLayout>
  );

  if (!user) return (
    <AdminLayout title="Kullanıcı">
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Kullanıcı bulunamadı.</div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Kullanıcı Detayı">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <button
          onClick={() => router.push('/admin/users')}
          style={{ background: 'transparent', border: 'none', color: 'var(--dim)', fontSize: 13, cursor: 'pointer' }}
        >
          ← Geri
        </button>
        <Btn onClick={handleSave} loading={saving}>Kaydet</Btn>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card title="Profil Bilgileri">
            <Field label="Ad Soyad">
              <input {...inp} value={form.full_name} onChange={e => handleChange('full_name', e.target.value)} placeholder="Ad Soyad" />
            </Field>
            <Field label="Kullanıcı Adı">
              <input {...inp} value={form.username} onChange={e => handleChange('username', e.target.value)} placeholder="kullaniciadi" />
            </Field>
            <Field label="E-posta (değiştirilemez)">
              <input {...inp} value={user.email} disabled style={{ ...inp.style, opacity: 0.5, cursor: 'not-allowed' }} />
            </Field>
            <Field label="Biyografi">
              <textarea {...inp} rows={4} value={form.bio} onChange={e => handleChange('bio', e.target.value)} placeholder="Kullanıcı hakkında..." />
            </Field>
            <Field label="Website">
              <input {...inp} value={form.website} onChange={e => handleChange('website', e.target.value)} placeholder="https://..." />
            </Field>
          </Card>

          <Card title="Sosyal Medya">
            <Field label="Instagram">
              <input {...inp} value={form.instagram} onChange={e => handleChange('instagram', e.target.value)} placeholder="@kullanici" />
            </Field>
            <Field label="Twitter">
              <input {...inp} value={form.twitter} onChange={e => handleChange('twitter', e.target.value)} placeholder="@kullanici" />
            </Field>
          </Card>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Avatar */}
          <Card title="Profil Görseli">
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'var(--red)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 700, margin: '0 auto',
                }}>
                  {(user.full_name || user.username || 'U')[0].toUpperCase()}
                </div>
              )}
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 12 }}>
                {user.full_name || user.username}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{user.email}</div>
            </div>
          </Card>

          {/* Role & Status */}
          <Card title="Rol & Durum">
            <Field label="Rol">
              <select {...inp} value={form.role} onChange={e => handleChange('role', e.target.value)}>
                {Object.entries(USER_ROLES).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Field>
            <Toggle label="Aktif" checked={form.is_active} onChange={v => handleChange('is_active', v)} />
            <Toggle label="Doğrulanmış" checked={form.is_verified} onChange={v => handleChange('is_verified', v)} />
          </Card>

          {/* Stats */}
          <Card title="İstatistikler">
            {[
              { label: 'Değerlendirmeler', value: user.reviews_count || 0 },
              { label: 'Favoriler', value: user.favorites_count || 0 },
              { label: 'Takipçiler', value: user.followers_count || 0 },
              { label: 'Takip Edilenler', value: user.following_count || 0 },
            ].map(stat => (
              <div key={stat.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: `1px solid ${'var(--border)'}`,
              }}>
                <span style={{ fontSize: 13, color: 'var(--dim)' }}>{stat.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{stat.value}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>
              Kayıt: {new Date(user.created_at).toLocaleDateString('tr-TR')}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

const inp = {
  style: {
    width: '100%', background: 'var(--subtle-bg)',
    border: `1px solid ${'var(--border)'}`, borderRadius: 6,
    padding: '10px 12px', color: 'var(--text)',
    fontSize: 13, outline: 'none', resize: 'vertical',
  },
};

function Card({ title, children }) {
  return (
    <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${'var(--border)'}`, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--dim)' }}>
        {title.toUpperCase()}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 6 }}>
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <span style={{ fontSize: 13, color: 'var(--dim)' }}>{label}</span>
      <div onClick={() => onChange(!checked)} style={{ width: 40, height: 22, borderRadius: 11, background: checked ? 'var(--red)' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'var(--text)', transition: 'left 0.2s' }} />
      </div>
    </div>
  );
}

function Btn({ children, onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ background: 'var(--red)', border: 'none', color: 'var(--text)', padding: '10px 24px', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
      {loading ? '...' : children}
    </button>
  );
}

function Alert({ type, children }) {
  const color = type === 'error' ? '#ef4444' : '#10b981';
  return (
    <div style={{ padding: '12px 16px', background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 6, color, fontSize: 13, marginBottom: 20 }}>
      {children}
    </div>
  );
}