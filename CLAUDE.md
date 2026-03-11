# Filtresiz Gastronomi — Proje Bağlamı

## Proje Özeti
Türk mutfağı odaklı bir gastronomi platformu. Şehirler, yemekler, restoranlar, şefler ve makalelerden oluşan içerik kataloğu + kullanıcı sistemi + admin paneli.

## Tech Stack
- **Framework:** Next.js 14 (Pages Router, JSX — TypeScript yok)
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage)
- **Stil:** Inline CSS / style objesi (Tailwind yok, CSS modülü yok)
- **Harita:** react-simple-maps

## Tasarım Sistemi
Renkler `lib/constants.js` → `COLORS` sabitinden gelir:
- Arka plan: `#080808` (koyu siyah)
- Vurgu: `#e8000d` (kırmızı)
- Metin: `#ffffff`
- Dim/muted/border tonları için `rgba` değerleri

## Dizin Yapısı

```
pages/
  index.jsx              # Ana sayfa
  articles.jsx           # Makale listesi
  article/[slug].jsx     # Makale detay
  chefs.jsx              # Şef listesi
  chef/[slug].jsx        # Şef detay
  cities.jsx             # Şehirler
  city/[slug]            # Şehir detay (klasör)
  dishes.jsx             # Yemek listesi
  dish/[slug].jsx        # Yemek detay
  restaurants.jsx        # Restoran listesi
  restaurant/[slug].jsx  # Restoran detay
  search.jsx             # Arama
  favorites.jsx          # Favoriler (giriş gerekli)
  hesap.jsx              # Hesap ayarları
  profil/[username].jsx  # Kullanıcı profili
  register.jsx           # Kayıt
  login.jsx              # Giriş
  admin/                 # Admin paneli (aşağıya bak)

components/
  layout/
    Layout.jsx           # Genel sayfa layout'u
    Nav.jsx              # Üst navigasyon
    Footer.jsx           # Alt footer
  admin/
    AdminLayout.jsx      # Admin panel layout'u
  cards/                 # Kart bileşenleri
  common/
    Button.jsx
    Input.jsx
    Loading.jsx
  sections/              # Sayfa bölümleri

hooks/
  useAuth.js             # AuthProvider + useAuth hook (ana auth sistemi)
  useSiteSettings.js     # Site ayarları hook'u

lib/
  supabase.js            # Supabase client + rol helper fonksiyonları
  constants.js           # COLORS, REGIONS, DISH_CATEGORIES, ARTICLE_CATEGORIES vb.
  auth.js                # Auth yardımcıları
```

## Admin Paneli
```
pages/admin/
  index.jsx              # Dashboard
  homepage.jsx           # Ana sayfa içerik yönetimi
  settings.jsx           # Site ayarları
  permissions.jsx        # Yetki yönetimi
  articles/[id].jsx      # Makale düzenleme
  chefs/[id].jsx         # Şef düzenleme
  cities/[id].jsx        # Şehir düzenleme
  dishes/[id].jsx        # Yemek düzenleme
  restaurants/[id].jsx   # Restoran düzenleme
  users/                 # Kullanıcı yönetimi
```

## Kullanıcı Rolleri (hiyerarşi)
`superadmin > admin > editor > author > moderator > user`

Tanımlar `hooks/useAuth.js` → `ROLE_PERMISSIONS` içinde:
- **superadmin:** Her şey
- **admin:** Kullanıcı yönetimi dahil çoğu şey (superadmin rolü atayamaz)
- **editor:** İçerik yönetimi (dishes, restaurants, chefs, articles), yayınlayabilir
- **author:** Sadece kendi makaleleri, yayınlamak için onay gerekir
- **moderator:** Sadece dashboard (ileride yorum moderasyonu)
- **user:** Admin paneline erişim yok

## Auth Sistemi
- `hooks/useAuth.js` → `AuthProvider` ile sarılı, `useAuth()` hook'u ile kullanılır
- Kullanıcı adı veya e-posta ile giriş desteklenir
- `profiles` tablosundan rol okunur
- `lib/supabase.js` → `getUserRole`, `isAdmin`, `isEditorOrAbove`, `getStorageUrl` helper'ları

## Supabase Tabloları (bilinen)
- `profiles` — kullanıcı profilleri (id, email, full_name, username, role, is_active)
- `dishes` — yemekler
- `restaurants` — restoranlar
- `chefs` — şefler
- `articles` — makaleler
- `cities` — şehirler

## Kod Stili
- **JSX kullanılır, TypeScript yok**
- Arrow function yerine `function` keyword tercih edilir (hook'larda)
- Supabase sorguları direkt component içinde veya sayfa dosyasında yazılır
- Stil: inline `style={{}}` objesi, `COLORS` sabitinden renkler

## Env Değişkenleri
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Geliştirme
```bash
npm run dev    # geliştirme sunucusu
npm run build  # production build
```
