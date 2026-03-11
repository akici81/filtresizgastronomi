import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
const PRICE_LABELS = { budget: '₺ Ekonomik', moderate: '₺₺ Orta', expensive: '₺₺₺ Pahalı', luxury: '₺₺₺₺ Lüks' };

const DAYS_TR = { monday: 'Pazartesi', tuesday: 'Salı', wednesday: 'Çarşamba', thursday: 'Perşembe', friday: 'Cuma', saturday: 'Cumartesi', sunday: 'Pazar' };

export default function RestaurantDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState({ type: '', text: '' });
  const [isFavorited, setIsFavorited] = useState(false);
  const [favId, setFavId] = useState(null);

  useEffect(() => { if (slug) fetchRestaurant(); }, [slug]);
  useEffect(() => { if (restaurant && user) checkFavorite(); }, [restaurant, user]);

  async function fetchRestaurant() {
    setLoading(true);
    const { data } = await supabase
      .from('restaurants')
      .select('*, cities(id, name, slug)')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();
    setRestaurant(data);
    if (data) {
      // reviews tablosunda restaurant_id kolonu var
      const { data: r } = await supabase
        .from('reviews')
        .select('*, profiles(full_name, username, avatar_url)')
        .eq('restaurant_id', data.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      setReviews(r || []);
    }
    setLoading(false);
  }

  async function checkFavorite() {
    // favorites tablosunda restaurant_id kolonu var
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('restaurant_id', restaurant.id)
      .maybeSingle();
    setIsFavorited(!!data);
    setFavId(data?.id || null);
  }

  async function toggleFavorite() {
    if (!user) { router.push('/login'); return; }
    if (isFavorited && favId) {
      await supabase.from('favorites').delete().eq('id', favId);
      setIsFavorited(false);
      setFavId(null);
    } else {
      const { data } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, restaurant_id: restaurant.id })
        .select('id')
        .single();
      setIsFavorited(true);
      setFavId(data?.id || null);
    }
  }

  async function submitReview() {
    if (!user) { router.push('/login'); return; }
    if (!reviewForm.comment.trim()) { setReviewMsg({ type: 'error', text: 'Yorum yazınız.' }); return; }
    setSubmitting(true);
    // reviews tablosunda restaurant_id kolonu var, content kolonu kullanılıyor
    const { error } = await supabase.from('reviews').insert({
      user_id: user.id,
      restaurant_id: restaurant.id,
      rating: reviewForm.rating,
      content: reviewForm.comment,
      is_approved: true,
    });
    if (error) {
      setReviewMsg({ type: 'error', text: error.message });
    } else {
      setReviewMsg({ type: 'success', text: 'Yorumunuz eklendi!' });
      setReviewForm({ rating: 5, comment: '' });
      fetchRestaurant();
    }
    setSubmitting(false);
  }

  if (loading) return <Layout><div style={{ textAlign: 'center', padding: '120px 24px', color: 'var(--muted)' }}>Yükleniyor...</div></Layout>;
  if (!restaurant) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '120px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
        <h2>Restoran bulunamadı</h2>
        <button onClick={() => router.push('/restaurants')} style={{ marginTop: 16, background: 'var(--red)', border: 'none', color: 'var(--text)', padding: '10px 24px', borderRadius: 6, cursor: 'pointer' }}>Tüm Restoranlar</button>
      </div>
    </Layout>
  );

  const features = Array.isArray(restaurant.features) ? restaurant.features : [];
  const paymentMethods = Array.isArray(restaurant.payment_methods) ? restaurant.payment_methods : [];
  const gallery = Array.isArray(restaurant.gallery) ? restaurant.gallery : [];
  const workingHours = restaurant.working_hours && typeof restaurant.working_hours === 'object' ? restaurant.working_hours : null;

  return (
    <Layout>
      <Head>
        <title>{restaurant.seo_title || `${restaurant.name} | Filtresiz Gastronomi`}</title>
        <meta name="description" content={restaurant.seo_description || restaurant.short_description || ''} />
      </Head>

      {/* Hero */}
      <div style={{ position: 'relative', height: 480, overflow: 'hidden' }}>
        {restaurant.cover_image_url || restaurant.image_url
          ? <img src={restaurant.cover_image_url || restaurant.image_url} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'var(--hero-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>🏪</div>}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 40px 40px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {restaurant.is_premium && <Badge color={'var(--red)'}>⭐ Premium</Badge>}
              {restaurant.is_verified && <Badge color="#10b981">✓ Doğrulandı</Badge>}
            </div>
            <h1 style={{ fontSize: 48, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>{restaurant.name}</h1>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              {restaurant.cities?.name && (
                <span onClick={() => router.push(`/city/${restaurant.cities.slug}`)} style={{ fontSize: 14, color: 'var(--dim)', cursor: 'pointer' }}>
                  📍 {restaurant.cities.name}{restaurant.district ? `, ${restaurant.district}` : ''}
                </span>
              )}
              {restaurant.cuisine_type && <span style={{ fontSize: 14, color: 'var(--dim)' }}>{restaurant.cuisine_type}</span>}
              {restaurant.price_range && <span style={{ fontSize: 14, color: '#f59e0b' }}>{PRICE_LABELS[restaurant.price_range]}</span>}
              {restaurant.rating_avg > 0 && (
                <span style={{ fontSize: 14, color: '#f59e0b' }}>
                  ★ {Number(restaurant.rating_avg).toFixed(1)} ({restaurant.rating_count} değerlendirme)
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={toggleFavorite}
          style={{ position: 'absolute', top: 24, right: 24, background: isFavorited ? 'var(--red)' : 'rgba(0,0,0,0.6)', border: `1px solid ${isFavorited ? 'var(--red)' : 'rgba(255,255,255,0.2)'}`, backdropFilter: 'blur(8px)', color: 'var(--text)', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
        >
          {isFavorited ? '♥' : '♡'}
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 48 }}>
          {/* Sol */}
          <div>
            {restaurant.short_description && (
              <p style={{ fontSize: 18, color: 'var(--dim)', lineHeight: 1.7, marginBottom: 40, paddingBottom: 40, borderBottom: `1px solid ${'var(--border)'}` }}>
                {restaurant.short_description}
              </p>
            )}

            {restaurant.description && (
              <div style={{ marginBottom: 40, paddingBottom: 40, borderBottom: `1px solid ${'var(--border)'}` }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Hakkında</h2>
                <div style={{ fontSize: 15, color: 'var(--dim)', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: restaurant.description }} />
              </div>
            )}

            {/* Galeri */}
            {gallery.length > 0 && (
              <div style={{ marginBottom: 40, paddingBottom: 40, borderBottom: `1px solid ${'var(--border)'}` }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Galeri</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {gallery.map((img, i) => (
                    <img key={i} src={img} alt={`${restaurant.name} ${i + 1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
                  ))}
                </div>
              </div>
            )}

            {/* Yorumlar */}
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
                Değerlendirmeler {reviews.length > 0 && <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 16 }}>({reviews.length})</span>}
              </h2>
              {user ? (
                <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 12, padding: 24, marginBottom: 32 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Değerlendirme Yaz</h3>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} onClick={() => setReviewForm(p => ({ ...p, rating: star }))}
                        style={{ fontSize: 28, cursor: 'pointer', color: star <= reviewForm.rating ? '#f59e0b' : 'var(--border)', transition: 'color 0.15s' }}>★</span>
                    ))}
                  </div>
                  <textarea
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                    placeholder="Bu restoran hakkında düşüncelerinizi paylaşın..."
                    rows={4}
                    style={{ width: '100%', background: 'var(--subtle-bg)', border: `1px solid ${'var(--border)'}`, borderRadius: 8, padding: '12px 16px', color: 'var(--text)', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                  {reviewMsg.text && (
                    <div style={{ color: reviewMsg.type === 'error' ? '#ef4444' : '#10b981', fontSize: 13, marginTop: 8 }}>{reviewMsg.text}</div>
                  )}
                  <button onClick={submitReview} disabled={submitting}
                    style={{ marginTop: 12, background: 'var(--red)', border: 'none', color: 'var(--text)', padding: '10px 24px', borderRadius: 6, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                </div>
              ) : (
                <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 12, padding: 24, marginBottom: 32, textAlign: 'center' }}>
                  <p style={{ color: 'var(--dim)', marginBottom: 16 }}>Değerlendirme yapmak için giriş yapın</p>
                  <button onClick={() => router.push('/login')} style={{ background: 'var(--red)', border: 'none', color: 'var(--text)', padding: '10px 24px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Giriş Yap</button>
                </div>
              )}
              {reviews.length === 0
                ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>Henüz değerlendirme yok.</div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {reviews.map(review => (
                    <div key={review.id} style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 12, padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                            {(review.profiles?.full_name || review.profiles?.username || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{review.profiles?.full_name || review.profiles?.username}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(review.created_at).toLocaleDateString('tr-TR')}</div>
                          </div>
                        </div>
                        <div style={{ color: '#f59e0b' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                      </div>
                      <p style={{ margin: 0, fontSize: 14, color: 'var(--dim)', lineHeight: 1.6 }}>{review.content}</p>
                    </div>
                  ))}
                </div>}
            </div>
          </div>

          {/* Sağ Sidebar */}
          <div>
            <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 12, padding: 24, marginBottom: 24, position: 'sticky', top: 80 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Bilgiler</h3>
              {[
                restaurant.cities?.name && { label: 'Şehir', value: `${restaurant.cities.name}${restaurant.district ? ` / ${restaurant.district}` : ''}` },
                restaurant.cuisine_type && { label: 'Mutfak', value: restaurant.cuisine_type },
                restaurant.price_range && { label: 'Fiyat', value: PRICE_LABELS[restaurant.price_range] },
                restaurant.phone && { label: 'Telefon', value: restaurant.phone },
                restaurant.email && { label: 'E-posta', value: restaurant.email },
                restaurant.website && { label: 'Website', value: restaurant.website },
              ].filter(Boolean).map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${'var(--border)'}` }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 160, textAlign: 'right', wordBreak: 'break-all' }}>{item.value}</span>
                </div>
              ))}

              {restaurant.address && (
                <div style={{ marginTop: 16, fontSize: 13, color: 'var(--dim)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--muted)', display: 'block', marginBottom: 4 }}>ADRES</span>
                  {restaurant.address}
                </div>
              )}

              {/* Çalışma Saatleri */}
              {workingHours && Object.keys(workingHours).length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 10 }}>ÇALIŞMA SAATLERİ</div>
                  {Object.entries(workingHours).map(([day, hours]) => (
                    <div key={day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: `1px solid ${'var(--border)'}` }}>
                      <span style={{ color: 'var(--muted)' }}>{DAYS_TR[day] || day}</span>
                      <span>{hours || 'Kapalı'}</span>
                    </div>
                  ))}
                </div>
              )}

              {restaurant.reservation_required && restaurant.reservation_link && (
                <a href={restaurant.reservation_link} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', marginTop: 16, background: 'var(--red)', color: 'var(--text)', padding: '12px', borderRadius: 8, textAlign: 'center', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                  Rezervasyon Yap
                </a>
              )}

              {/* Sosyal Medya */}
              {(restaurant.instagram || restaurant.facebook || restaurant.twitter) && (
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  {restaurant.instagram && (
                    <a href={`https://instagram.com/${restaurant.instagram}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: 'var(--dim)', textDecoration: 'none' }}>Instagram</a>
                  )}
                  {restaurant.facebook && (
                    <a href={restaurant.facebook} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: 'var(--dim)', textDecoration: 'none' }}>Facebook</a>
                  )}
                  {restaurant.twitter && (
                    <a href={`https://twitter.com/${restaurant.twitter}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: 'var(--dim)', textDecoration: 'none' }}>Twitter</a>
                  )}
                </div>
              )}
            </div>

            {features.length > 0 && (
              <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Özellikler</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {features.map(f => (
                    <span key={f} style={{ fontSize: 11, padding: '4px 10px', background: 'var(--input-bg)', border: `1px solid ${'var(--border)'}`, borderRadius: 20, color: 'var(--dim)' }}>{f}</span>
                  ))}
                </div>
              </div>
            )}

            {paymentMethods.length > 0 && (
              <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 12, padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Ödeme Yöntemleri</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {paymentMethods.map(p => (
                    <span key={p} style={{ fontSize: 11, padding: '4px 10px', background: 'var(--input-bg)', border: `1px solid ${'var(--border)'}`, borderRadius: 20, color: 'var(--dim)' }}>{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Badge({ children, color }) {
  return <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{children}</span>;
}