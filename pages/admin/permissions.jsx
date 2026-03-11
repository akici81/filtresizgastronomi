import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../lib/constants';

// Tanımlı özellikler ve hangi rollere atanabileceği
const FEATURE_DEFINITIONS = [
  {
    group: 'İçerik Yönetimi',
    features: [
      { key: 'dishes.create',    label: 'Yemek Ekle',              roles: ['admin','editor'] },
      { key: 'dishes.edit',      label: 'Yemek Düzenle',           roles: ['admin','editor'] },
      { key: 'dishes.delete',    label: 'Yemek Sil',               roles: ['admin'] },
      { key: 'dishes.publish',   label: 'Yemek Yayınla',           roles: ['admin','editor'] },
      { key: 'restaurants.create', label: 'Restoran Ekle',         roles: ['admin','editor'] },
      { key: 'restaurants.edit',   label: 'Restoran Düzenle',      roles: ['admin','editor'] },
      { key: 'restaurants.delete', label: 'Restoran Sil',          roles: ['admin'] },
      { key: 'restaurants.publish','label': 'Restoran Yayınla',    roles: ['admin','editor'] },
      { key: 'chefs.create',     label: 'Şef Ekle',                roles: ['admin','editor'] },
      { key: 'chefs.edit',       label: 'Şef Düzenle',             roles: ['admin','editor'] },
      { key: 'chefs.delete',     label: 'Şef Sil',                 roles: ['admin'] },
      { key: 'cities.create',    label: 'Şehir Ekle',              roles: ['admin'] },
      { key: 'cities.edit',      label: 'Şehir Düzenle',           roles: ['admin'] },
      { key: 'cities.delete',    label: 'Şehir Sil',               roles: ['admin'] },
    ],
  },
  {
    group: 'Makale & Yorum',
    features: [
      { key: 'articles.create',  label: 'Makale Yaz',              roles: ['admin','editor','author'] },
      { key: 'articles.edit_own',label: 'Kendi Makalesini Düzenle', roles: ['admin','editor','author'] },
      { key: 'articles.edit_all',label: 'Tüm Makaleleri Düzenle',  roles: ['admin','editor'] },
      { key: 'articles.delete',  label: 'Makale Sil',              roles: ['admin','editor'] },
      { key: 'articles.publish', label: 'Makale Yayınla',          roles: ['admin','editor'] },
      { key: 'comments.moderate',label: 'Yorum Moderasyonu',       roles: ['admin','editor','moderator'] },
      { key: 'reviews.moderate', label: 'Değerlendirme Moderasyonu', roles: ['admin','moderator'] },
    ],
  },
  {
    group: 'Kullanıcı & Sistem',
    features: [
      { key: 'users.view',       label: 'Kullanıcıları Gör',       roles: ['admin'] },
      { key: 'users.edit',       label: 'Kullanıcı Düzenle',       roles: ['admin'] },
      { key: 'users.ban',        label: 'Kullanıcı Engelle',       roles: ['admin','moderator'] },
      { key: 'homepage.manage',  label: 'Ana Sayfa Yönet',         roles: ['admin','editor'] },
      { key: 'settings.view',    label: 'Ayarları Gör',            roles: ['admin'] },
      { key: 'settings.edit',    label: 'Ayarları Düzenle',        roles: ['admin'] },
    ],
  },
];

const ROLE_INFO = {
  admin:     { label: 'Admin',     color: '#f59e0b', desc: 'Tam yetki, süper admin hariç' },
  editor:    { label: 'Editör',    color: '#3b82f6', desc: 'İçerik onaylama ve düzenleme' },
  author:    { label: 'Yazar',     color: '#8b5cf6', desc: 'Makale yazma' },
  moderator: { label: 'Moderatör', color: '#10b981', desc: 'Yorum ve değerlendirme denetimi' },
};

export default function PermissionsPage() {
  const { isSuperAdmin, profile } = useAuth();
  const router = useRouter();
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [activeRole, setActiveRole] = useState('editor');

  useEffect(() => {
    fetchPermissions();
  }, []);

  async function fetchPermissions() {
    setLoading(true);
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'role_permissions')
      .maybeSingle();

    if (data?.value) {
      setPermissions(typeof data.value === 'string' ? JSON.parse(data.value) : data.value);
    } else {
      // Varsayılan izinleri yükle
      const defaults = {};
      FEATURE_DEFINITIONS.forEach(group => {
        group.features.forEach(f => {
          f.roles.forEach(role => {
            if (!defaults[role]) defaults[role] = {};
            defaults[role][f.key] = true;
          });
        });
      });
      setPermissions(defaults);
    }
    setLoading(false);
  }

  function togglePermission(role, featureKey) {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [featureKey]: !prev[role]?.[featureKey],
      },
    }));
  }

  function hasPermission(role, featureKey) {
    return permissions[role]?.[featureKey] ?? false;
  }

  async function handleSave() {
    setSaving(true);
    setSuccess('');
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        key: 'role_permissions',
        value: JSON.stringify(permissions),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (!error) setSuccess('İzinler kaydedildi!');
    setSaving(false);
  }

  if (loading) return (
    <AdminLayout title="Yetki Yönetimi">
      <div style={{ textAlign: 'center', padding: 60, color: COLORS.muted }}>Yükleniyor...</div>
    </AdminLayout>
  );

  const currentFeatures = FEATURE_DEFINITIONS.flatMap(g => g.features).filter(f => f.roles.includes(activeRole));

  return (
    <AdminLayout title="Yetki Yönetimi">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 900 }}>Rol İzinleri</h2>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.muted }}>
            Süper Admin her zaman tam yetkiye sahiptir. Burada diğer rollerin yetkilerini özelleştirebilirsiniz.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {success && <span style={{ fontSize: 12, color: '#10b981' }}>{success}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: COLORS.red, border: 'none', color: COLORS.white, padding: '10px 24px', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'KAYDEDİLİYOR...' : 'KAYDET'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
        {/* Rol Seçici */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(ROLE_INFO).map(([roleKey, info]) => (
            <div
              key={roleKey}
              onClick={() => setActiveRole(roleKey)}
              style={{
                padding: '14px 16px',
                borderRadius: 8,
                border: `1px solid ${activeRole === roleKey ? info.color : COLORS.border}`,
                background: activeRole === roleKey ? `${info.color}15` : COLORS.card,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: info.color }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.white }}>{info.label}</span>
              </div>
              <div style={{ fontSize: 11, color: COLORS.muted }}>{info.desc}</div>
            </div>
          ))}

          {/* Süper Admin bilgi kutusu */}
          <div style={{ padding: '14px 16px', borderRadius: 8, border: `1px solid #f59e0b40`, background: '#f59e0b08', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12 }}>👑</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>Süper Admin</span>
            </div>
            <div style={{ fontSize: 11, color: COLORS.muted }}>Her zaman tam yetki. Değiştirilemez.</div>
          </div>
        </div>

        {/* İzin Listesi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {FEATURE_DEFINITIONS.map(group => {
            const groupFeatures = group.features.filter(f => f.roles.includes(activeRole));
            if (groupFeatures.length === 0) return null;
            return (
              <div key={group.group} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: COLORS.dim, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{group.group.toUpperCase()}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => groupFeatures.forEach(f => setPermissions(prev => ({ ...prev, [activeRole]: { ...prev[activeRole], [f.key]: true } })))}
                      style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.dim, padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
                    >Tümünü Aç</button>
                    <button
                      onClick={() => groupFeatures.forEach(f => setPermissions(prev => ({ ...prev, [activeRole]: { ...prev[activeRole], [f.key]: false } })))}
                      style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.dim, padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
                    >Tümünü Kapat</button>
                  </div>
                </div>
                <div style={{ padding: '8px 0' }}>
                  {groupFeatures.map(feature => (
                    <div
                      key={feature.key}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: `1px solid ${COLORS.border}10` }}
                    >
                      <div>
                        <div style={{ fontSize: 13, color: COLORS.white }}>{feature.label}</div>
                        <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{feature.key}</div>
                      </div>
                      <Toggle
                        checked={hasPermission(activeRole, feature.key)}
                        onChange={() => togglePermission(activeRole, feature.key)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {currentFeatures.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: COLORS.muted, background: COLORS.card, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
              Bu rol için tanımlanmış özellik bulunmuyor.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <div onClick={onChange}
      style={{ width: 44, height: 24, borderRadius: 12, background: checked ? COLORS.red : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 4, left: checked ? 23 : 4, width: 16, height: 16, borderRadius: '50%', background: COLORS.white, transition: 'left 0.2s' }} />
    </div>
  );
}