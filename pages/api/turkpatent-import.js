// pages/api/turkpatent-import.js
// Sunucu tarafında Türkpatent sayfasını parse eder, dishes tablosu için veri döner.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, idStart, idEnd, mode } = req.body;

  try {
    if (mode === 'single') {
      if (!url) return res.status(400).json({ error: 'URL gerekli' });
      const data = await scrapeOne(url);
      return res.status(200).json({ results: [data] });
    }

    if (mode === 'bulk') {
      if (!idStart || !idEnd) return res.status(400).json({ error: 'ID aralığı gerekli' });
      const start = parseInt(idStart);
      const end = parseInt(idEnd);
      if (isNaN(start) || isNaN(end) || end < start || end - start > 200) {
        return res.status(400).json({ error: 'Geçersiz aralık (max 200 kayıt)' });
      }

      const results = [];
      const errors = [];

      for (let id = start; id <= end; id++) {
        try {
          const pageUrl = `https://ci.turkpatent.gov.tr/cografi-isaretler/detay/${id}`;
          const data = await scrapeOne(pageUrl);
          // Sadece yemek kategorisindeki kayıtları al
          if (data && isFood(data.urun_grubu)) {
            results.push(data);
          }
        } catch (e) {
          errors.push({ id, error: e.message });
        }
        // Rate limiting - sunucuya saygı göster
        await sleep(300);
      }

      return res.status(200).json({ results, errors, total: results.length });
    }

    return res.status(400).json({ error: 'Geçersiz mode' });
  } catch (err) {
    console.error('Türkpatent import error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function scrapeOne(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; FiltresizGastronomi/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'tr-TR,tr;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();

  // 404 / boş sayfa kontrolü
  if (html.includes('Sayfa Bulunamadı') || html.includes('404')) {
    throw new Error('Sayfa bulunamadı');
  }

  return parseDetail(html, url);
}

function parseDetail(html, sourceUrl) {
  // Basit regex tabanlı parse (cheerio gerektirmez)
  const extract = (label) => {
    // "Etiket\n  Değer" formatını yakala
    const pattern = new RegExp(
      label + '[\\s\\S]*?<\\/[^>]+>[\\s\\S]*?<[^>]+>([^<]+)<',
      'i'
    );
    const m = html.match(pattern);
    return m ? m[1].trim() : null;
  };

  // Başlık (h1)
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const name = titleMatch ? titleMatch[1].trim() : null;

  if (!name) throw new Error('Ürün adı bulunamadı (muhtemelen boş sayfa)');

  // Liste öğelerinden veri çek
  const listItems = html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];

  const fields = {};
  listItems.forEach((li) => {
    const text = li.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    if (text.includes('Coğrafi işaretin türü')) {
      fields.ci_turu = text.split('Coğrafi işaretin türü')[1].trim();
    }
    if (text.includes('Dosya Numarası')) {
      fields.dosya_no = text.split('Dosya Numarası')[1].trim();
    }
    if (text.includes('Tescil Numarası')) {
      fields.tescil_no = text.split('Tescil Numarası')[1].trim();
    }
    if (text.includes('Tescil Tarihi')) {
      fields.tescil_tarihi = text.split('Tescil Tarihi')[1].trim();
    }
    if (text.includes('Başvuru Tarihi')) {
      fields.basvuru_tarihi = text.split('Başvuru Tarihi')[1].trim();
    }
    if (text.includes('Ürün Grubu')) {
      fields.urun_grubu = text.split('Ürün Grubu')[1].trim();
    }
    if (text.includes('İl')) {
      const ilText = text.split('İl')[1].trim();
      // Sadece il adını al (başka şeyler gelebilir)
      fields.il = ilText.split(/\s/)[0].trim();
    }
    if (text.includes('Durum')) {
      fields.durum = text.split('Durum')[1].trim();
    }
    if (text.includes('Başvuru Yapan')) {
      fields.basvuru_yapan = text.split('Başvuru Yapan/Tescil Ettiren')[1]?.trim()
        || text.split('Başvuru Yapan')[1]?.trim();
    }
  });

  // Görsel URL: /Pictures/GeographicalSigns/{tescil_no}.jpg
  const imgMatch = html.match(/\/Pictures\/GeographicalSigns\/([^"']+\.(jpg|png|jpeg))/i);
  const imageUrl = imgMatch
    ? `https://ci.turkpatent.gov.tr/${imgMatch[0].replace(/^\//, '')}`
    : null;

  // ID'yi URL'den çek
  const idMatch = sourceUrl.match(/\/detay\/(\d+)/);
  const turkpatentId = idMatch ? parseInt(idMatch[1]) : null;

  // dishes tablosu için mapping
  return {
    // Ham veriler
    turkpatent_id: turkpatentId,
    source_url: sourceUrl,
    name,
    urun_grubu: fields.urun_grubu || null,
    il: fields.il || null,
    ci_turu: fields.ci_turu || null,       // Mahreç İşareti / Menşe Adı
    tescil_no: fields.tescil_no || null,
    tescil_tarihi: fields.tescil_tarihi || null,
    basvuru_tarihi: fields.basvuru_tarihi || null,
    dosya_no: fields.dosya_no || null,
    basvuru_yapan: fields.basvuru_yapan || null,
    durum: fields.durum || null,
    image_url: imageUrl,

    // dishes tablosu için önerilen alanlar
    mapped: {
      name,
      // city_id: admin panelinde il adına göre eşlenecek
      city_name: fields.il || null,
      geographical_indication: fields.ci_turu || null,
      geographical_indication_no: fields.tescil_no || null,
      geographical_indication_date: fields.tescil_tarihi || null,
      image_url: imageUrl,
      is_geographical_indication: true,
    },
  };
}

function isFood(urunGrubu) {
  if (!urunGrubu) return false;
  const foodKeywords = [
    'yemek', 'çorba', 'tatlı', 'içecek', 'gıda', 'tarımsal',
    'meyve', 'sebze', 'et', 'süt', 'peynir', 'ekmek', 'unlu',
    'zeytin', 'bal', 'reçel', 'turşu', 'baharat',
  ];
  const lower = urunGrubu.toLowerCase();
  return foodKeywords.some((kw) => lower.includes(kw));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}