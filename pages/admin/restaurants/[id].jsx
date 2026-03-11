import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import { supabase } from '../../../lib/supabase';
const DAYS = [
  { key: 'monday', label: 'Pazartesi' },
  { key: 'tuesday', label: 'Salı' },
  { key: 'wednesday', label: 'Çarşamba' },
  { key: 'thursday', label: 'Perşembe' },
  { key: 'friday', label: 'Cuma' },
  { key: 'saturday', label: 'Cumartesi' },
  { key: 'sunday', label: 'Pazar' },
];

const DEFAULT_HOURS = { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' };

const EMPTY_FORM = {
  name: '', slug: '', city_id: '', cuisine_type: '',
  short_description: '', description: '',
  phone: '', email: '', website: '', address: '', district: '',
  latitude: '', longitude: '',
  instagram: '', facebook: '', twitter: '',
  price_range: 'moderate', reservation_required: false, reservation_link: '',
  features: '', payment_methods: '',
  image_url: '', cover_image_url: '', logo_url: '', video_url: '',
  status: 'draft', is_featured: false, is_premium: false, is_verified: false,
  seo_title: '', seo_description: '',
};

export default function RestaurantForm() {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';

  const [form, setForm] = useState(EMPTY_FORM);
  const [workingHours, setWorkingHours] = useState(DEFAULT_HOURS);
  const [gallery, setGallery] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCities();
    if (!isNew && id) fetchRestaurant();
  }, [id]);

  async function fetchCities() {
    const { data } = await supabase.from('cities').select('id, name').eq('is_active', true).order('name');
    setCities(data || []);
  }

  async function fetchRestaurant() {
    setLoading(true);
    const { data } = await supabase.from('restaurants').select('*').eq('id', id).single();
    if (data) {
      setForm({
        ...EMPTY_FORM, ...data,
        city_id: data.city_id || '',
        features: Array.isArray(data.features) ? data.features.join(', ') : '',
        payment_methods: Array.isArray(data.payment_methods) ? data.payment_methods.join(', ') : '',
        latitude: data.latitude || '',
        longitude: data.longitude || '',
      });
      if (data.working_hours && typeof data.working_hours === 'object') {
        setWorkingHours({ ...DEFAULT_HOURS, ...data.working_hours });
      }
      if (Array.isArray(data.gallery) && data.gallery.length > 0) {
        setGallery(data.gallery);
      }
    }
    setLoading(false);
  }

  function handleChange(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === 'name' && (isNew || !form.slug)) {
      setForm(prev => ({
        ...prev, name: value,
        slug: value.toLowerCase()
          .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
          .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
          .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
      }));
    }
  }

  function handleHoursChange(day, value) {
    setWorkingHours(prev => ({ ...prev, [day]: value }));
  }

  async function handleImageUpload(e, field) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(field);
    const ext = file.name.split('.').pop();
    const path = `restaurants/${Date.now()}_${field}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('images').getPublicUrl(path);
      handleChange(field, data.publicUrl);
    }
    setUploading(false);
  }

  async function handleGalleryUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading('gallery');
    const urls = [];
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const path = `restaurants/gallery/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('images').upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from('images').getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    setGallery(prev => [...prev, ...urls]);
    setUploading(false);
  }

  function removeGalleryImage(i) {
    setGallery(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave(status) {
    setError(''); setSuccess('');
    if (!form.name) { setError('Restoran adı zorunludur.'); return; }
    if (!form.slug) { setError('Slug zorunludur.'); return; }
    setSaving(true);

    const payload = {
      ...form,
      status: status || form.status,
      city_id: form.city_id || null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      features: form.features ? form.features.split(',').map(t => t.trim()).filter(Boolean) : [],
      payment_methods: form.payment_methods ? form.payment_methods.split(',').map(t => t.trim()).filter(Boolean) : [],
      working_hours: workingHours,
      gallery,
      published_at: status === 'published' ? new Date().toISOString() : (form.published_at || null),
    };

    let result;
    if (isNew) {
      result = await supabase.from('restaurants').insert(payload).select().single();
    } else {
      result = await supabase.from('restaurants').update(payload).eq('id', id).select().single();
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess('Kaydedildi!');
      if (isNew) router.push(`/admin/restaurants/${result.data.id}`);
    }
    setSaving(false);
  }

  if (loading) return (
    <AdminLayout title="Restoran">
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Yükleniyor...</div>
    </AdminLayout>
  );

  return (
    <AdminLayout title={isNew ? 'Yeni Restoran' : 'Restoranı Düzenle'}>
      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <button onClick={() => router.push('/admin/restaurants')}
          style={{ background: 'transparent', border: 'none', color: 'var(--dim)', fontSize: 13, cursor: 'pointer' }}>
          ← Geri
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={() => handleSave('draft')} loading={saving} variant="secondary">Taslak Kaydet</Btn>
          <Btn onClick={() => handleSave('published')} loading={saving}>Yayınla</Btn>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Sol Kolon */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Temel Bilgiler */}
          <Card title="Temel Bilgiler">
            <Field label="Restoran Adı *">
              <input style={inp} value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="Çiçek Pasajı" />
            </Field>
            <Field label="Slug *">
              <input style={inp} value={form.slug} onChange={e => handleChange('slug', e.target.value)} placeholder="cicek-pasaji" />
            </Field>
            <Field label="Mutfak Türü">
              <input style={inp} value={form.cuisine_type} onChange={e => handleChange('cuisine_type', e.target.value)} placeholder="Türk, Akdeniz, Karışık..." />
            </Field>
            <Field label="Kısa Açıklama">
              <textarea style={inp} rows={2} value={form.short_description} onChange={e => handleChange('short_description', e.target.value)} placeholder="Tek cümlelik açıklama..." />
            </Field>
            <Field label="Açıklama">
              <textarea style={inp} rows={5} value={form.description} onChange={e => handleChange('description', e.target.value)} placeholder="Restoran hakkında detaylı bilgi..." />
            </Field>
          </Card>

          {/* İletişim */}
          <Card title="İletişim Bilgileri">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Telefon">
                <input style={inp} value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+90 212 000 00 00" />
              </Field>
              <Field label="E-posta">
                <input style={inp} type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="info@restoran.com" />
              </Field>
            </div>
            <Field label="Website">
              <input style={inp} value={form.website} onChange={e => handleChange('website', e.target.value)} placeholder="https://restoran.com" />
            </Field>
            <Field label="Adres">
              <textarea style={inp} rows={2} value={form.address} onChange={e => handleChange('address', e.target.value)} placeholder="Tam adres..." />
            </Field>
            <Field label="İlçe">
              <input style={inp} value={form.district} onChange={e => handleChange('district', e.target.value)} placeholder="Beyoğlu" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Enlem (Latitude)">
                <input style={inp} type="number" step="any" value={form.latitude} onChange={e => handleChange('latitude', e.target.value)} placeholder="41.0082" />
              </Field>
              <Field label="Boylam (Longitude)">
                <input style={inp} type="number" step="any" value={form.longitude} onChange={e => handleChange('longitude', e.target.value)} placeholder="28.9784" />
              </Field>
            </div>
          </Card>

          {/* Çalışma Saatleri */}
          <Card title="Çalışma Saatleri">
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
              Boş bırakılan günler "Kapalı" olarak gösterilir. Örnek: 09:00 - 22:00
            </div>
            {DAYS.map(day => (
              <div key={day.key} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12, marginBottom: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--dim)' }}>{day.label}</span>
                <input
                  style={inp}
                  value={workingHours[day.key]}
                  onChange={e => handleHoursChange(day.key, e.target.value)}
                  placeholder="09:00 - 22:00"
                />
              </div>
            ))}
          </Card>

          {/* Sosyal Medya */}
          <Card title="Sosyal Medya">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="Instagram">
                <input style={inp} value={form.instagram} onChange={e => handleChange('instagram', e.target.value)} placeholder="restoran" />
              </Field>
              <Field label="Facebook">
                <input style={inp} value={form.facebook} onChange={e => handleChange('facebook', e.target.value)} placeholder="restoran" />
              </Field>
              <Field label="Twitter">
                <input style={inp} value={form.twitter} onChange={e => handleChange('twitter', e.target.value)} placeholder="restoran" />
              </Field>
            </div>
          </Card>

          {/* Özellikler */}
          <Card title="Özellikler & Ödeme">
            <Field label="Özellikler (virgülle ayır)">
              <input style={inp} value={form.features} onChange={e => handleChange('features', e.target.value)} placeholder="wifi, vale, bahçe, canlı müzik" />
            </Field>
            <Field label="Ödeme Yöntemleri (virgülle ayır)">
              <input style={inp} value={form.payment_methods} onChange={e => handleChange('payment_methods', e.target.value)} placeholder="nakit, kredi kartı, sodexo" />
            </Field>
            <Field label="Rezervasyon Linki">
              <input style={inp} value={form.reservation_link} onChange={e => handleChange('reservation_link', e.target.value)} placeholder="https://rezervasyon.com" />
            </Field>
          </Card>

          {/* Galeri */}
          <Card title="Galeri">
            {gallery.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                {gallery.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 6 }} />
                    <button onClick={() => removeGalleryImage(i)}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', width: 20, height: 20, borderRadius: '50%', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <label style={{ display: 'block', padding: '12px', border: `1px dashed ${'var(--border)'}`, borderRadius: 6, textAlign: 'center', cursor: 'pointer', fontSize: 12, color: 'var(--dim)' }}>
              {uploading === 'gallery' ? 'Yükleniyor...' : '📁 Galeri Görseli Ekle (çoklu seçim)'}
              <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} style={{ display: 'none' }} />
            </label>
          </Card>

          {/* SEO */}
          <Card title="SEO">
            <Field label="SEO Başlık">
              <input style={inp} value={form.seo_title} onChange={e => handleChange('seo_title', e.target.value)} placeholder="Restoran Adı | Filtresiz Gastronomi" />
            </Field>
            <Field label="SEO Açıklama">
              <textarea style={inp} rows={2} value={form.seo_description} onChange={e => handleChange('seo_description', e.target.value)} placeholder="Meta açıklama (max 160 karakter)" />
            </Field>
          </Card>
        </div>

        {/* Sağ Kolon */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Durum */}
          <Card title="Durum">
            <Field label="Yayın Durumu">
              <select style={inp} value={form.status} onChange={e => handleChange('status', e.target.value)}>
                <option value="draft">Taslak</option>
                <option value="pending">İnceleme Bekliyor</option>
                <option value="published">Yayında</option>
                <option value="archived">Arşiv</option>
              </select>
            </Field>
            <Toggle label="Öne Çıkan" checked={form.is_featured} onChange={v => handleChange('is_featured', v)} />
            <Toggle label="Premium" checked={form.is_premium} onChange={v => handleChange('is_premium', v)} />
            <Toggle label="Doğrulanmış" checked={form.is_verified} onChange={v => handleChange('is_verified', v)} />
            <Toggle label="Rezervasyon Gerekli" checked={form.reservation_required} onChange={v => handleChange('reservation_required', v)} />
          </Card>

          {/* Konum & Kategori */}
          <Card title="Konum & Kategori">
            <Field label="Şehir">
              <select style={inp} value={form.city_id} onChange={e => handleChange('city_id', e.target.value)}>
                <option value="">Şehir Seç</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Fiyat Aralığı">
              <select style={inp} value={form.price_range} onChange={e => handleChange('price_range', e.target.value)}>
                <option value="budget">₺ — Ekonomik</option>
                <option value="moderate">₺₺ — Orta</option>
                <option value="expensive">₺₺₺ — Pahalı</option>
                <option value="luxury">₺₺₺₺ — Lüks</option>
              </select>
            </Field>
          </Card>

          {/* Ana Görsel */}
          <Card title="Ana Görsel">
            {form.image_url && (
              <img src={form.image_url} alt="" style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 6, marginBottom: 10 }} />
            )}
            <Field label="Görsel URL">
              <input style={inp} value={form.image_url} onChange={e => handleChange('image_url', e.target.value)} placeholder="https://..." />
            </Field>
            <UploadBtn uploading={uploading === 'image_url'} onChange={e => handleImageUpload(e, 'image_url')} />
          </Card>

          {/* Kapak Görseli */}
          <Card title="Kapak Görseli">
            {form.cover_image_url && (
              <img src={form.cover_image_url} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6, marginBottom: 10 }} />
            )}
            <Field label="Kapak URL">
              <input style={inp} value={form.cover_image_url} onChange={e => handleChange('cover_image_url', e.target.value)} placeholder="https://..." />
            </Field>
            <UploadBtn uploading={uploading === 'cover_image_url'} onChange={e => handleImageUpload(e, 'cover_image_url')} />
          </Card>

          {/* Logo */}
          <Card title="Logo">
            {form.logo_url && (
              <img src={form.logo_url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, marginBottom: 10 }} />
            )}
            <Field label="Logo URL">
              <input style={inp} value={form.logo_url} onChange={e => handleChange('logo_url', e.target.value)} placeholder="https://..." />
            </Field>
            <UploadBtn uploading={uploading === 'logo_url'} onChange={e => handleImageUpload(e, 'logo_url')} label="📁 Logo Seç" />
          </Card>

          {/* Video */}
          <Card title="Video">
            <Field label="Video URL">
              <input style={inp} value={form.video_url} onChange={e => handleChange('video_url', e.target.value)} placeholder="YouTube veya Vimeo URL" />
            </Field>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

// Stiller ve yardımcı komponentler
const inp = {
  width: '100%', background: 'var(--subtle-bg)',
  border: `1px solid ${'var(--border)'}`, borderRadius: 6,
  padding: '10px 12px', color: 'var(--text)', fontSize: 13,
  outline: 'none', resize: 'vertical', boxSizing: 'border-box',
};

function UploadBtn({ uploading, onChange, label = '📁 Dosya Seç' }) {
  return (
    <label style={{ display: 'block', padding: '8px', border: `1px dashed ${'var(--border)'}`, borderRadius: 6, textAlign: 'center', cursor: 'pointer', fontSize: 12, color: 'var(--dim)', marginTop: 6 }}>
      {uploading ? 'Yükleniyor...' : label}
      <input type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} />
    </label>
  );
}

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
      <div onClick={() => onChange(!checked)}
        style={{ width: 40, height: 22, borderRadius: 11, background: checked ? 'var(--red)' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'var(--text)', transition: 'left 0.2s' }} />
      </div>
    </div>
  );
}

function Btn({ children, onClick, loading, variant = 'primary' }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ background: variant === 'primary' ? 'var(--red)' : 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text)', padding: '10px 20px', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
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