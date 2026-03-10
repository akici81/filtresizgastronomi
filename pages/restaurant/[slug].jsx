import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../lib/constants';

const PRICE_LABELS = { budget: '₺ Ekonomik', moderate: '₺₺ Orta', expensive: '₺₺₺ Pahalı', luxury: '₺₺₺₺ Lüks' };

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

  useEffect(() => { if (slug) fetchRestaurant(); }, [slug]);
  useEffect(() => { if (restaurant && user) checkFavorite(); }, [restaurant, user]);

  async function fetchRestaurant() {
    setLoading(true);
    const { data } = await supabase.from('restaurants').select('*, cities(id, name, slug)').eq('slug', slug).eq('status', 'published').single();
    setRestaurant(data);
    if (data) {
      const { data: r } = await supabase.from('reviews').select('*, profiles(full_name, username, avatar_url)').eq('entity_type', 'restaurant').eq('entity_id', data.id).eq('is_approved', true).order('created_at', { ascending: false });
      setReviews(r || []);
    }
    setLoading(false);
  }

  async function checkFavorite() {
    const { data } = await supabase.from('favorites').select('id').eq('user_id', user.id).eq('entity_type', 'restaurant').eq('entity_id', restaurant.id).single();
    setIsFavorited(!!data);
  }

  async function toggleFavorite() {
    if (!user) { router.push('/login'); return; }
    if (isFavorited) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('entity_type', 'restaurant').eq('entity_id', restaurant.id);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, entity_type: 'restaurant', entity_id: restaurant.id });
    }
    setIsFavorited(!isFavorited);
  }

  async function submitReview() {
    if (!user) { router.push('/login'); return; }
    if (!reviewForm.comment.trim()) { setReviewMsg({ type: 'error', text: 'Yorum yazınız.' }); return; }
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({ user_id: user.id, entity_type: 'restaurant', entity_id: restaurant.id, rating: reviewForm.rating, comment: reviewForm.comment, is_approved: true });
    if (error) { setReviewMsg({ type: 'error', text: error.message }); }
    else { setReviewMsg({ type: 'success', text: 'Yorumunuz eklendi!' }); setReviewForm({ rating: 5, comment: '' }); fetchRestaurant(); }
    setSubmitting(false);
  }

  if (loading) return <Layout><div style={{ textAlign: 'center', padding: '120px 24px', color: COLORS.muted }}>Yükleniyor...</div></Layout>;
  if (!restaurant) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '120px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
        <h2>Restoran bulunamadı</h2>
        <button onClick={() => router.push('/restaurants')} style={{ marginTop: 16, background: COLORS.red, border: 'none', color: COLORS.white, padding: '10px 24px', borderRadius: 6, cursor: 'pointer' }}>Tüm Restoranlar</button>
      </div>
    </Layout>
  );

  const features = Array.isArray(restaurant.features) ? restaurant.features : [];
  const paymentMethods = Array.isArray(restaurant.payment_methods) ? restaurant.payment_methods : [];

  return (
    <Layout>
      <Head>
        <title>{restaurant.seo_title || `${restaurant.name} | Filtresiz Gastronomi`}</title>
        <meta name="description" content={restaurant.seo_description || restaurant.short_description || ''} />
      </Head>

      {/* Hero */}
      <div style={{ position: 'relative', height: 480, overflow: 'hidden' }}>
        {restaurant.image_url
          ? <img src={restaurant.image_url} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a0000, #0d0d0d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>🏪</div>}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 40px 40px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {restaurant.is_premium && <Badge color={COLORS.red}>Premium</Badge>}
              {restaurant.is_verified && <Badge color="#10b981">✓ Doğrulandı</Badge>}
            </div>
            <h1 style={{ fontSize: 48, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>{restaurant.name}</h1>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              {restaurant.cities?.name && <span onClick={() => router.push(`/city/${restaurant.cities.slug}`)} style={{ fontSize: 14, color: COLORS.dim, cursor: 'pointer' }}>📍 {restaurant.cities.name}</span>}
              {restaurant.cuisine_type && <span style={{ fontSize: 14, color: COLORS.dim }}>{restaurant.cuisine_type}</span>}
              {restaurant.price_range && <span style={{ fontSize: 14, color: '#f59e0b' }}>{PRICE_LABELS[restaurant.price_range]}</span>}
              {restaurant.average_rating > 0 && <span style={{ fontSize: 14, color: '#f59e0b' }}>★ {Number(restaurant.average_rating).toFixed(1)} ({restaurant.reviews_count})</span>}
            </div>
          </div>
        </div>
        <button onClick={toggleFavorite} style={{ position: 'absolute', top: 24, right: 24, background: isFavorited ? COLORS.red : 'rgba(0,0,0,0.6)', border: `1px solid ${isFavorited ? COLORS.red : 'rgba(255,255,255,0.2)'}`, backdropFilter: 'blur(8px)', color: COLORS.white, width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isFavorited ? '♥' : '♡'}
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 48 }}>
          {/* Sol */}
          <div>
            {restaurant.short_description && <p style={{ fontSize: 18, color: COLORS.dim, lineHeight: 1.7, marginBottom: 40, paddingBottom: 40, borderBottom: `1px solid ${COLORS.border}` }}>{restaurant.short_description}</p>}
            {restaurant.description && (
              <div style={{ marginBottom: 40, paddingBottom: 40, borderBottom: `1px solid ${COLORS.border}` }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Hakkında</h2>
                <div style={{ fontSize: 15, color: COLORS.dim, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: restaurant.description }} />
              </div>
            )}

            {/* Yorumlar */}
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Değerlendirmeler {reviews.length > 0 && <span style={{ color: COLORS.muted, fontWeight: 400, fontSize: 16 }}>({reviews.length})</span>}</h2>
              {user ? (
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24, marginBottom: 32 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Değerlendirme Yaz</h3>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {[1,2,3,4,5].map(star => <span key={star} onClick={() => setReviewForm(p => ({ ...p, rating: star }))} style={{ fontSize: 28, cursor: 'pointer', color: star <= reviewForm.rating ? '#f59e0b' : COLORS.border, transition: 'color 0.15s' }}>★</span>)}
                  </div>
                  <textarea value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))} placeholder="Bu restoran hakkında düşüncelerinizi paylaşın..." rows={4}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 16px', color: COLORS.white, fontSize: 14, outline: 'none', resize: 'vertical' }} />
                  {reviewMsg.text && <div style={{ color: reviewMsg.type === 'error' ? '#ef4444' : '#10b981', fontSize: 13, marginTop: 8 }}>{reviewMsg.text}</div>}
                  <button onClick={submitReview} disabled={submitting} style={{ marginTop: 12, background: COLORS.red, border: 'none', color: COLORS.white, padding: '10px 24px', borderRadius: 6, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, opacity: submitting ? 0.7 : 1 }}>{submitting ? 'Gönderiliyor...' : 'Gönder'}</button>
                </div>
              ) : (
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24, marginBottom: 32, textAlign: 'center' }}>
                  <p style={{ color: COLORS.dim, marginBottom: 16 }}>Değerlendirme yapmak için giriş yapın</p>
                  <button onClick={() => router.push('/login')} style={{ background: COLORS.red, border: 'none', color: COLORS.white, padding: '10px 24px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Giriş Yap</button>
                </div>
              )}
              {reviews.length === 0
                ? <div style={{ textAlign: 'center', padding: '40px 0', color: COLORS.muted }}>Henüz değerlendirme yok.</div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {reviews.map(review => (
                      <div key={review.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: COLORS.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{(review.profiles?.full_name || review.profiles?.username || 'U')[0].toUpperCase()}</div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600 }}>{review.profiles?.full_name || review.profiles?.username}</div>
                              <div style={{ fontSize: 11, color: COLORS.muted }}>{new Date(review.created_at).toLocaleDateString('tr-TR')}</div>
                            </div>
                          </div>
                          <div style={{ color: '#f59e0b' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: COLORS.dim, lineHeight: 1.6 }}>{review.comment}</p>
                      </div>
                    ))}
                  </div>}
            </div>
          </div>

          {/* Sağ Sidebar */}
          <div>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24, marginBottom: 24, position: 'sticky', top: 80 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Bilgiler</h3>
              {[
                restaurant.cities?.name && { label: 'Şehir', value: restaurant.cities.name },
                restaurant.district && { label: 'İlçe', value: restaurant.district },
                restaurant.cuisine_type && { label: 'Mutfak', value: restaurant.cuisine_type },
                restaurant.price_range && { label: 'Fiyat', value: PRICE_LABELS[restaurant.price_range] },
                restaurant.phone && { label: 'Telefon', value: restaurant.phone },
                restaurant.website && { label: 'Website', value: restaurant.website },
              ].filter(Boolean).map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: 13, color: COLORS.muted }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 160, textAlign: 'right', wordBreak: 'break-all' }}>{item.value}</span>
                </div>
              ))}
              {restaurant.address && (
                <div style={{ marginTop: 16, fontSize: 13, color: COLORS.dim, lineHeight: 1.5 }}>
                  <span style={{ color: COLORS.muted, display: 'block', marginBottom: 4 }}>ADRES</span>
                  {restaurant.address}
                </div>
              )}
              {restaurant.reservation_required && restaurant.reservation_link && (
                <a href={restaurant.reservation_link} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', marginTop: 16, background: COLORS.red, color: COLORS.white, padding: '12px', borderRadius: 8, textAlign: 'center', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                  Rezervasyon Yap
                </a>
              )}
            </div>
            {features.length > 0 && (
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Özellikler</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {features.map(f => <span key={f} style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 20, color: COLORS.dim }}>{f}</span>)}
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
