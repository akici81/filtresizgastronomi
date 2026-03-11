import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
const TABS = [
  { key: 'profile',  label: 'Profil Bilgileri', icon: '👤' },
  { key: 'account',  label: 'Hesap & Güvenlik',  icon: '🔒' },
  { key: 'social',   label: 'Sosyal Medya',       icon: '🔗' },
];

const inp = {
  width: '100%', background: 'var(--input-bg)', border: `1px solid ${'var(--border)'}`,
  borderRadius: 6, color: 'var(--text)', padding: '10px 14px', fontSize: 14, outline: 'none',
  boxSizing: 'border-box',
};

const label = { fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block', fontWeight: 600, letterSpacing: '0.05em' };

export default function HesapPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const fileRef = useRef();

  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [form, setForm] = useState({
    full_name: '', username: '', bio: '', website: '',
    instagram: '', twitter: '', youtube: '', tiktok: '',
    avatar_url: '', cover_image_url: '',
  });

  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login?redirect=/hesap'); return; }
    if (profile) {
      setForm({
        full_name:       profile.full_name || '',
        username:        profile.username || '',
        bio:             profile.bio || '',
        website:         profile.website || '',
        instagram:       profile.instagram || '',
        twitter:         profile.twitter || '',
        youtube:         profile.youtube || '',
        tiktok:          profile.tiktok || '',
        avatar_url:      profile.avatar_url || '',
        cover_image_url: profile.cover_image_url || '',
      });
    }
  }, [user, profile, authLoading]);

  function setField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function uploadAvatar(file) {
    if (!file) return;
    setAvatarUploading(true);
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true });
    if (error) { setMsg({ type: 'error', text: 'Görsel yüklenemedi.' }); setAvatarUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
    setField('avatar_url', publicUrl);
    setAvatarUploading(false);
  }

  async function saveProfile() {
    setSaving(true);
    setMsg(null);

    // Username unique kontrolü
    if (form.username !== profile.username) {
      const { data: existing } = await supabase
        .from('profiles').select('id').eq('username', form.username.toLowerCase()).maybeSingle();
      if (existing) {
        setMsg({ type: 'error', text: 'Bu kullanıcı adı zaten kullanılıyor.' });
        setSaving(false); return;
      }
    }

    const { error } = await supabase.from('profiles').update({
      full_name:       form.full_name,
      username:        form.username.toLowerCase(),
      bio:             form.bio,
      website:         form.website,
      instagram:       form.instagram,
      twitter:         form.twitter,
      youtube:         form.youtube,
      tiktok:          form.tiktok,
      avatar_url:      form.avatar_url,
      cover_image_url: form.cover_image_url,
      updated_at:      new Date().toISOString(),
    }).eq('id', user.id);

    if (error) setMsg({ type: 'error', text: 'Kaydedilemedi: ' + error.message });
    else setMsg({ type: 'success', text: 'Profil güncellendi!' });
    setSaving(false);
  }

  async function changePassword() {
    if (!pwForm.new || pwForm.new !== pwForm.confirm) {
      setMsg({ type: 'error', text: 'Şifreler eşleşmiyor.' }); return;
    }
    if (pwForm.new.length < 6) {
      setMsg({ type: 'error', text: 'Şifre en az 6 karakter olmalı.' }); return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.new });
    if (error) setMsg({ type: 'error', text: error.message });
    else { setMsg({ type: 'success', text: 'Şifre değiştirildi!' }); setPwForm({ current: '', new: '', confirm: '' }); }
    setSaving(false);
  }

  if (authLoading) return (
    <Layout><div style={{ textAlign: 'center', padding: '120px 24px', color: 'var(--muted)' }}>Yükleniyor...</div></Layout>
  );

  return (
    <Layout>
      <Head><title>Hesap Ayarları | Filtresiz Gastronomi</title></Head>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 900 }}>⚙️ Hesap Ayarları</h1>
        <p style={{ margin: '0 0 32px', fontSize: 14, color: 'var(--muted)' }}>Profil bilgilerini ve hesap ayarlarını yönet.</p>

        {/* Sekmeler */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${'var(--border)'}`, marginBottom: 32 }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setMsg(null); }}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '10px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
                color: activeTab === tab.key ? 'var(--text)' : 'var(--dim)',
                fontWeight: activeTab === tab.key ? 700 : 400,
                borderBottom: activeTab === tab.key ? `2px solid ${'var(--red)'}` : '2px solid transparent',
                marginBottom: -1,
              }}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* Mesaj */}
        {msg && (
          <div style={{ marginBottom: 24, padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: msg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${msg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: msg.type === 'success' ? '#22c55e' : '#ef4444' }}>
            {msg.type === 'success' ? '✓ ' : '✕ '}{msg.text}
          </div>
        )}

        {/* ===================== PROFİL SEKMESİ ===================== */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, flexShrink: 0, border: `3px solid ${'var(--border)'}` }}>
                {form.avatar_url
                  ? <img src={form.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (form.full_name || form.username || 'U')[0].toUpperCase()}
              </div>
              <div>
                <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={e => uploadAvatar(e.target.files[0])} />
                <button onClick={() => fileRef.current.click()} disabled={avatarUploading}
                  style={{ background: 'var(--input-bg)', border: `1px solid ${'var(--border)'}`, color: 'var(--text)', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13, marginRight: 8 }}>
                  {avatarUploading ? 'Yükleniyor...' : '📷 Fotoğraf Yükle'}
                </button>
                {form.avatar_url && (
                  <button onClick={() => setField('avatar_url', '')}
                    style={{ background: 'transparent', border: `1px solid rgba(239,68,68,0.3)`, color: '#ef4444', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                    Kaldır
                  </button>
                )}
                <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--muted)' }}>JPG veya PNG. Maks 2MB.</p>
              </div>
            </div>

            {/* Ad Soyad + Kullanıcı Adı */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <span style={label}>AD SOYAD</span>
                <input style={inp} value={form.full_name} onChange={e => setField('full_name', e.target.value)} placeholder="Adın Soyadın" />
              </div>
              <div>
                <span style={label}>KULLANICI ADI</span>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 14 }}>@</span>
                  <input style={{ ...inp, paddingLeft: 28 }} value={form.username} onChange={e => setField('username', e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())} placeholder="kullanici_adi" />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <span style={label}>BİYOGRAFİ</span>
              <textarea style={{ ...inp, resize: 'vertical', minHeight: 100, lineHeight: 1.6 }}
                value={form.bio} onChange={e => setField('bio', e.target.value)}
                placeholder="Kendin hakkında kısa bir şeyler yaz..." maxLength={300} />
              <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{form.bio.length}/300</div>
            </div>

            {/* Website */}
            <div>
              <span style={label}>WEBSİTE</span>
              <input style={inp} value={form.website} onChange={e => setField('website', e.target.value)} placeholder="https://siten.com" />
            </div>

            <button onClick={saveProfile} disabled={saving}
              style={{ alignSelf: 'flex-start', background: saving ? 'rgba(232,0,13,0.5)' : 'var(--red)', border: 'none', color: 'var(--text)', padding: '12px 28px', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700 }}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        )}

        {/* ===================== HESAP & GÜVENLİK ===================== */}
        {activeTab === 'account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* E-posta (readonly) */}
            <div style={{ padding: 20, background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 10 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>E-posta Adresi</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input style={{ ...inp, flex: 1, opacity: 0.6 }} value={user?.email || ''} readOnly />
                <span style={{ fontSize: 11, color: '#22c55e', whiteSpace: 'nowrap' }}>✓ Doğrulandı</span>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--muted)' }}>E-posta değiştirmek için destek ile iletişime geç.</p>
            </div>

            {/* Şifre Değiştir */}
            <div style={{ padding: 20, background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 10 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Şifre Değiştir</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <span style={label}>YENİ ŞİFRE</span>
                  <input type="password" style={inp} value={pwForm.new} onChange={e => setPwForm(p => ({ ...p, new: e.target.value }))} placeholder="En az 6 karakter" />
                </div>
                <div>
                  <span style={label}>YENİ ŞİFRE (TEKRAR)</span>
                  <input type="password" style={inp} value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} placeholder="Şifreyi tekrar gir" />
                </div>
                <button onClick={changePassword} disabled={saving}
                  style={{ alignSelf: 'flex-start', background: saving ? 'rgba(232,0,13,0.5)' : 'var(--red)', border: 'none', color: 'var(--text)', padding: '10px 24px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                  {saving ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                </button>
              </div>
            </div>

            {/* Rol Bilgisi */}
            <div style={{ padding: 20, background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 10 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Hesap Bilgileri</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Rol', value: profile?.role || 'user' },
                  { label: 'Üye tarihi', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-' },
                  { label: 'Doğrulama', value: profile?.is_verified ? '✓ Doğrulanmış Hesap' : 'Doğrulanmamış' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${'var(--border)'}` }}>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: item.label === 'Doğrulama' && profile?.is_verified ? '#22c55e' : 'var(--text)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== SOSYAL MEDYA ===================== */}
        {activeTab === 'social' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--muted)' }}>Sosyal medya hesaplarını profiline ekle.</p>

            {[
              { key: 'instagram', label: 'INSTAGRAM', prefix: 'instagram.com/', placeholder: 'kullanici_adi' },
              { key: 'twitter',   label: 'TWITTER / X', prefix: 'x.com/',          placeholder: 'kullanici_adi' },
              { key: 'youtube',   label: 'YOUTUBE',    prefix: 'youtube.com/',    placeholder: 'kanal_adi' },
              { key: 'tiktok',    label: 'TİKTOK',     prefix: 'tiktok.com/@',    placeholder: 'kullanici_adi' },
            ].map(s => (
              <div key={s.key}>
                <span style={label}>{s.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: `1px solid ${'var(--border)'}`, borderRadius: 6, overflow: 'hidden' }}>
                  <span style={{ padding: '10px 12px', fontSize: 12, color: 'var(--muted)', background: 'var(--subtle-bg)', borderRight: `1px solid ${'var(--border)'}`, whiteSpace: 'nowrap' }}>
                    {s.prefix}
                  </span>
                  <input
                    style={{ flex: 1, background: 'var(--input-bg)', border: 'none', color: 'var(--text)', padding: '10px 14px', fontSize: 14, outline: 'none' }}
                    value={form[s.key]} onChange={e => setField(s.key, e.target.value)} placeholder={s.placeholder}
                  />
                </div>
              </div>
            ))}

            <button onClick={saveProfile} disabled={saving}
              style={{ alignSelf: 'flex-start', marginTop: 8, background: saving ? 'rgba(232,0,13,0.5)' : 'var(--red)', border: 'none', color: 'var(--text)', padding: '12px 28px', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700 }}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}