import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import { supabase } from '../../../lib/supabase';
const EMPTY_FORM = {
  name: '', slug: '', title: '', city_id: '',
  bio: '', short_bio: '', education: '',
  experience_years: '', specialties: '',
  email: '', phone: '', website: '',
  instagram: '', twitter: '', youtube: '', tiktok: '',
  image_url: '', cover_image_url: '',
  status: 'draft', is_featured: false,
  seo_title: '', seo_description: '',
};

const EMPTY_AWARD = { year: '', title: '', organization: '' };
const EMPTY_CAREER = { years: '', place: '', position: '' };

export default function ChefForm() {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';

  const [form, setForm] = useState(EMPTY_FORM);
  const [awards, setAwards] = useState([]);
  const [careerHistory, setCareerHistory] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCities();
    if (!isNew && id) fetchChef();
  }, [id]);

  async function fetchCities() {
    const { data } = await supabase.from('cities').select('id, name').eq('is_active', true).order('name');
    setCities(data || []);
  }

  async function fetchChef() {
    setLoading(true);
    const { data } = await supabase.from('chefs').select('*').eq('id', id).single();
    if (data) {
      setForm({
        ...EMPTY_FORM, ...data,
        city_id: data.city_id || '',
        specialties: Array.isArray(data.specialties) ? data.specialties.join(', ') : '',
        experience_years: data.experience_years || '',
      });
      if (Array.isArray(data.awards) && data.awards.length > 0) setAwards(data.awards);
      if (Array.isArray(data.career_history) && data.career_history.length > 0) setCareerHistory(data.career_history);
      if (Array.isArray(data.gallery) && data.gallery.length > 0) setGallery(data.gallery);
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

  // Ödül işlemleri
  function handleAwardChange(i, key, value) {
    setAwards(prev => prev.map((a, idx) => idx === i ? { ...a, [key]: value } : a));
  }
  function addAward() { setAwards(prev => [...prev, { ...EMPTY_AWARD }]); }
  function removeAward(i) { setAwards(prev => prev.filter((_, idx) => idx !== i)); }

  // Kariyer işlemleri
  function handleCareerChange(i, key, value) {
    setCareerHistory(prev => prev.map((c, idx) => idx === i ? { ...c, [key]: value } : c));
  }
  function addCareer() { setCareerHistory(prev => [...prev, { ...EMPTY_CAREER }]); }
  function removeCareer(i) { setCareerHistory(prev => prev.filter((_, idx) => idx !== i)); }

  async function handleImageUpload(e, field) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(field);
    const ext = file.name.split('.').pop();
    const path = `chefs/${Date.now()}_${field}.${ext}`;
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
      const path = `chefs/gallery/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
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
    if (!form.name) { setError('Şef adı zorunludur.'); return; }
    if (!form.slug) { setError('Slug zorunludur.'); return; }
    setSaving(true);

    const payload = {
      ...form,
      status: status || form.status,
      city_id: form.city_id || null,
      experience_years: form.experience_years ? parseInt(form.experience_years) : null,
      specialties: form.specialties ? form.specialties.split(',').map(t => t.trim()).filter(Boolean) : [],
      awards: awards.filter(a => a.title?.trim()),
      career_history: careerHistory.filter(c => c.place?.trim()),
      gallery,
      published_at: status === 'published' ? new Date().toISOString() : (form.published_at || null),
    };

    let result;
    if (isNew) {
      result = await supabase.from('chefs').insert(payload).select().single();
    } else {
      result = await supabase.from('chefs').update(payload).eq('id', id).select().single();
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess('Kaydedildi!');
      if (isNew) router.push(`/admin/chefs/${result.data.id}`);
    }
    setSaving(false);
  }

  if (loading) return (
    <AdminLayout title="Şef">
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Yükleniyor...</div>
    </AdminLayout>
  );

  return (
    <AdminLayout title={isNew ? 'Yeni Şef' : 'Şefi Düzenle'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <button onClick={() => router.push('/admin/chefs')}
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
            <Field label="Ad Soyad *">
              <input style={inp} value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="Mehmet Yalçınkaya" />
            </Field>
            <Field label="Slug *">
              <input style={inp} value={form.slug} onChange={e => handleChange('slug', e.target.value)} placeholder="mehmet-yalcinkaya" />
            </Field>
            <Field label="Ünvan">
              <input style={inp} value={form.title} onChange={e => handleChange('title', e.target.value)} placeholder="Executive Chef" />
            </Field>
            <Field label="Kısa Biyografi">
              <textarea style={inp} rows={2} value={form.short_bio} onChange={e => handleChange('short_bio', e.target.value)} placeholder="Tek paragraf özet..." />
            </Field>
            <Field label="Biyografi">
              <textarea style={inp} rows={6} value={form.bio} onChange={e => handleChange('bio', e.target.value)} placeholder="Detaylı biyografi..." />
            </Field>
          </Card>

          {/* Kariyer */}
          <Card title="Kariyer">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Deneyim (Yıl)">
                <input style={inp} type="number" value={form.experience_years} onChange={e => handleChange('experience_years', e.target.value)} placeholder="15" />
              </Field>
              <Field label="Şehir">
                <select style={inp} value={form.city_id} onChange={e => handleChange('city_id', e.target.value)}>
                  <option value="">Şehir Seç</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Uzmanlık Alanları (virgülle ayır)">
              <input style={inp} value={form.specialties} onChange={e => handleChange('specialties', e.target.value)} placeholder="Türk Mutfağı, Tatlı, Deniz Ürünleri" />
            </Field>
            <Field label="Eğitim">
              <textarea style={inp} rows={3} value={form.education} onChange={e => handleChange('education', e.target.value)} placeholder="Eğitim geçmişi..." />
            </Field>
          </Card>

          {/* Kariyer Geçmişi */}
          <Card title="Kariyer Geçmişi">
            {careerHistory.map((c, i) => (
              <div key={i} style={{ marginBottom: 12, padding: 12, background: 'var(--subtle-bg)', borderRadius: 6, border: `1px solid ${'var(--border)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>POZISYON {i + 1}</span>
                  <button onClick={() => removeCareer(i)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>Sil</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <input style={inp} value={c.place} onChange={e => handleCareerChange(i, 'place', e.target.value)} placeholder="Restoran / Şirket" />
                  <input style={inp} value={c.position} onChange={e => handleCareerChange(i, 'position', e.target.value)} placeholder="Pozisyon" />
                  <input style={inp} value={c.years} onChange={e => handleCareerChange(i, 'years', e.target.value)} placeholder="2018 - 2022" />
                </div>
              </div>
            ))}
            <button onClick={addCareer}
              style={{ background: 'transparent', border: `1px dashed ${'var(--border)'}`, color: 'var(--dim)', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 12, width: '100%' }}>
              + Pozisyon Ekle
            </button>
          </Card>

          {/* Ödüller */}
          <Card title="Ödüller & Başarılar">
            {awards.map((a, i) => (
              <div key={i} style={{ marginBottom: 12, padding: 12, background: 'var(--subtle-bg)', borderRadius: 6, border: `1px solid ${'var(--border)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>ÖDÜL {i + 1}</span>
                  <button onClick={() => removeAward(i)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>Sil</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 8 }}>
                  <input style={inp} value={a.year} onChange={e => handleAwardChange(i, 'year', e.target.value)} placeholder="2023" />
                  <input style={inp} value={a.title} onChange={e => handleAwardChange(i, 'title', e.target.value)} placeholder="Ödül adı" />
                  <input style={inp} value={a.organization} onChange={e => handleAwardChange(i, 'organization', e.target.value)} placeholder="Kurum" />
                </div>
              </div>
            ))}
            <button onClick={addAward}
              style={{ background: 'transparent', border: `1px dashed ${'var(--border)'}`, color: 'var(--dim)', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 12, width: '100%' }}>
              + Ödül Ekle
            </button>
          </Card>

          {/* İletişim & Sosyal */}
          <Card title="İletişim & Sosyal Medya">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="E-posta">
                <input style={inp} type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="sef@email.com" />
              </Field>
              <Field label="Telefon">
                <input style={inp} value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+90 500 000 00 00" />
              </Field>
            </div>
            <Field label="Website">
              <input style={inp} value={form.website} onChange={e => handleChange('website', e.target.value)} placeholder="https://..." />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Instagram">
                <input style={inp} value={form.instagram} onChange={e => handleChange('instagram', e.target.value)} placeholder="@sef" />
              </Field>
              <Field label="Twitter">
                <input style={inp} value={form.twitter} onChange={e => handleChange('twitter', e.target.value)} placeholder="@sef" />
              </Field>
              <Field label="YouTube">
                <input style={inp} value={form.youtube} onChange={e => handleChange('youtube', e.target.value)} placeholder="kanal adı" />
              </Field>
              <Field label="TikTok">
                <input style={inp} value={form.tiktok} onChange={e => handleChange('tiktok', e.target.value)} placeholder="@sef" />
              </Field>
            </div>
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
              <input style={inp} value={form.seo_title} onChange={e => handleChange('seo_title', e.target.value)} placeholder="Şef Adı | Filtresiz Gastronomi" />
            </Field>
            <Field label="SEO Açıklama">
              <textarea style={inp} rows={2} value={form.seo_description} onChange={e => handleChange('seo_description', e.target.value)} placeholder="Meta açıklama..." />
            </Field>
          </Card>
        </div>

        {/* Sağ Kolon */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

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
          </Card>

          <Card title="Profil Görseli">
            {form.image_url && (
              <img src={form.image_url} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 6, marginBottom: 10 }} />
            )}
            <Field label="Görsel URL">
              <input style={inp} value={form.image_url} onChange={e => handleChange('image_url', e.target.value)} placeholder="https://..." />
            </Field>
            <UploadBtn uploading={uploading === 'image_url'} onChange={e => handleImageUpload(e, 'image_url')} />
          </Card>

          <Card title="Kapak Görseli">
            {form.cover_image_url && (
              <img src={form.cover_image_url} alt="" style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 6, marginBottom: 10 }} />
            )}
            <Field label="Kapak URL">
              <input style={inp} value={form.cover_image_url} onChange={e => handleChange('cover_image_url', e.target.value)} placeholder="https://..." />
            </Field>
            <UploadBtn uploading={uploading === 'cover_image_url'} onChange={e => handleImageUpload(e, 'cover_image_url')} />
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

const inp = {
  width: '100%', background: 'var(--subtle-bg)',
  border: `1px solid ${'var(--border)'}`, borderRadius: 6,
  padding: '10px 12px', color: 'var(--text)', fontSize: 13,
  outline: 'none', resize: 'vertical', boxSizing: 'border-box',
};

function UploadBtn({ uploading, onChange }) {
  return (
    <label style={{ display: 'block', padding: '8px', border: `1px dashed ${'var(--border)'}`, borderRadius: 6, textAlign: 'center', cursor: 'pointer', fontSize: 12, color: 'var(--dim)', marginTop: 6 }}>
      {uploading ? 'Yükleniyor...' : '📁 Dosya Seç'}
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