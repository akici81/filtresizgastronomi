# Filtresiz Gastronomi — Kurulum Kılavuzu

## 1. Supabase Kurulumu

1. [supabase.com](https://supabase.com) → New Project oluştur
2. **SQL Editor** → `supabase_setup.sql` dosyasının tamamını yapıştır → Run
3. **Settings > API** → `URL` ve `anon key` değerlerini kopyala

---

## 2. VS Code Kurulumu

```bash
# Projeyi klonla
git clone https://github.com/KULLANICI_ADIN/filtresiz-gastronomi.git
cd filtresiz-gastronomi

# Bağımlılıkları yükle
npm install

# .env.local dosyasını düzenle
# NEXT_PUBLIC_SUPABASE_URL=https://XXXXX.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcıda aç: [http://localhost:3000](http://localhost:3000)

---

## 3. GitHub'a Push

```bash
git init
git add .
git commit -m "ilk commit"
git remote add origin https://github.com/KULLANICI_ADIN/filtresiz-gastronomi.git
git push -u origin main
```

---

## 4. Vercel Deploy

1. [vercel.com](https://vercel.com) → New Project → GitHub repoyu seç
2. **Environment Variables** ekle:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy → bitti!

---

## 5. İlk Admin Kullanıcısı Oluşturma

Supabase'de **Authentication > Users > Invite user** ile e-posta gönder.

Kullanıcı kayıt olduktan sonra **SQL Editor**'da şunu çalıştır:

```sql
UPDATE kullanicilar SET rol = 'admin' WHERE email = 'senin@email.com';
```

Artık `/admin/giris` ile giriş yapabilirsin.

---

## Proje Yapısı

```
pages/
├── index.jsx              → Ana sayfa
├── sehir/[slug].jsx       → Şehir sayfası
├── yemek/[slug].jsx       → Yemek sayfası (yapılacak)
└── admin/
    ├── giris.jsx          → Admin giriş
    ├── index.jsx          → Dashboard
    ├── sehirler/          → Şehir yönetimi
    ├── yemekler/          → Yemek yönetimi
    ├── restoranlar/       → Restoran yönetimi
    └── kullanicilar/      → Kullanıcı & rol yönetimi

components/
└── AdminLayout.jsx        → Admin panel şablonu

lib/
├── supabase.js            → Supabase client
└── auth.js                → Auth yardımcıları
```

---

## Supabase Tablo Yapısı

| Tablo | Açıklama |
|---|---|
| `kullanicilar` | Admin / editör / üye rolleri |
| `sehirler` | 81 şehir ve mutfak bilgileri |
| `yemekler` | Yöresel yemek veritabanı |
| `restoranlar` | Restoran listesi (premium destekli) |
| `sefler` | Şef profilleri |
| `galeri` | Fotoğraf galerisi |
| `degerlendirmeler` | Kullanıcı yorumları ve puanları |
