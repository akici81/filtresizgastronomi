import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
const GROUPS = [
  { key: 'general', label: 'Genel' },
  { key: 'hero', label: 'Hero' },
  { key: 'social', label: 'Sosyal Medya' },
  { key: 'contact', label: 'İletişim' },
  { key: 'footer', label: 'Footer' },
  { key: 'seo', label: 'SEO' },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [activeGroup, setActiveGroup] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    setLoading(true);
    const { data } = await supabase.from('site_settings').select('*').order('id');
    if (data) {
      const obj = {};
      data.forEach(s => { obj[s.key] = { ...s }; });
      setSettings(obj);
    }
    setLoading(false);
  }

  function handleChange(key, value) {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
  }

  async function handleSave() {
    setError('');
    setSuccess('');
    setSaving(true);

    const updates = Object.values(settings).map(s => ({
      id: s.id,
      key: s.key,
      value: s.value,
      type: s.type,
      group_name: s.group_name,
      label: s.label,
      description: s.description,
      is_public: s.is_public,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('site_settings').upsert(updates);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Ayarlar kaydedildi!');
      setTimeout(() => setSuccess(''), 3000);
    }
    setSaving(false);
  }

  async function handleImageUpload(e, key) {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop();
    const path = `settings/${key}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('images').getPublicUrl(path);
      handleChange(key, data.publicUrl);
    }
  }

  const groupSettings = Object.values(settings).filter(
    s => s.group_name === activeGroup
  );

  if (loading) return (
    <AdminLayout title="Ayarlar">
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Yükleniyor...</div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Site Ayarları">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <Btn onClick={handleSave} loading={saving}>Tüm Ayarları Kaydet</Btn>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
        {/* Sidebar */}
        <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 8, overflow: 'hidden', height: 'fit-content' }}>
          {GROUPS.map(g => (
            <div
              key={g.key}
              onClick={() => setActiveGroup(g.key)}
              style={{
                padding: '12px 16px',
                fontSize: 13,
                cursor: 'pointer',
                color: activeGroup === g.key ? 'var(--text)' : 'var(--dim)',
                background: activeGroup === g.key ? 'rgba(232,0,13,0.1)' : 'transparent',
                borderLeft: activeGroup === g.key ? `2px solid ${'var(--red)'}` : '2px solid transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { if (activeGroup !== g.key) e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={(e) => { if (activeGroup !== g.key) e.currentTarget.style.color = 'var(--dim)'; }}
            >
              {g.label}
            </div>
          ))}
        </div>

        {/* Settings Form */}
        <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${'var(--border)'}`, fontSize: 13, fontWeight: 700 }}>
            {GROUPS.find(g => g.key === activeGroup)?.label} Ayarları
          </div>
          <div style={{ padding: 24 }}>
            {groupSettings.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Bu grupta ayar bulunamadı.</div>
            ) : (
              groupSettings.map(setting => (
                <div key={setting.key} style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                    {setting.label}
                  </label>
                  {setting.description && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                      {setting.description}
                    </div>
                  )}

                  {setting.type === 'image' ? (
                    <div>
                      {setting.value && (
                        <img src={setting.value} alt="" style={{ height: 60, borderRadius: 4, marginBottom: 8, objectFit: 'contain', background: 'var(--input-bg)', padding: 4 }} />
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          {...inp}
                          value={setting.value || ''}
                          onChange={e => handleChange(setting.key, e.target.value)}
                          placeholder="https://..."
                          style={{ ...inp.style, flex: 1 }}
                        />
                        <label style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '0 16px', border: `1px dashed ${'var(--border)'}`,
                          borderRadius: 6, cursor: 'pointer', fontSize: 12, color: 'var(--dim)',
                          whiteSpace: 'nowrap',
                        }}>
                          📁 Yükle
                          <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setting.key)} style={{ display: 'none' }} />
                        </label>
                      </div>
                    </div>
                  ) : setting.type === 'html' || (setting.value && setting.value.length > 100) ? (
                    <textarea
                      {...inp}
                      rows={4}
                      value={setting.value || ''}
                      onChange={e => handleChange(setting.key, e.target.value)}
                    />
                  ) : setting.type === 'boolean' ? (
                    <Toggle
                      label=""
                      checked={setting.value === 'true'}
                      onChange={v => handleChange(setting.key, v ? 'true' : 'false')}
                    />
                  ) : (
                    <input
                      {...inp}
                      value={setting.value || ''}
                      onChange={e => handleChange(setting.key, e.target.value)}
                    />
                  )}
                </div>
              ))
            )}
          </div>
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

function Toggle({ label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div onClick={() => onChange(!checked)} style={{ width: 40, height: 22, borderRadius: 11, background: checked ? 'var(--red)' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'var(--text)', transition: 'left 0.2s' }} />
      </div>
      {label && <span style={{ fontSize: 13, color: 'var(--dim)' }}>{label}</span>}
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