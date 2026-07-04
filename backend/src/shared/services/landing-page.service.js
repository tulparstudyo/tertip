import { env } from '../../config/env.js';

export const LANDING_PAGE_KEY = 'landing_page';

const ENV_PLACEHOLDER_RESOLVERS = {
  '[PAYMENT_AMOUNT]': () => (env.paymentAmount != null ? String(env.paymentAmount) : ''),
  '[PAYMENT_CURRENCY]': () => env.paymentCurrency ?? 'TRY',
};

export function resolveLandingEnvPlaceholders(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    let result = value;
    for (const [token, resolve] of Object.entries(ENV_PLACEHOLDER_RESOLVERS)) {
      result = result.split(token).join(resolve());
    }
    return result;
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveLandingEnvPlaceholders(item));
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveLandingEnvPlaceholders(item)]),
    );
  }
  return value;
}

export function getLandingEnvPlaceholderKeys() {
  return Object.keys(ENV_PLACEHOLDER_RESOLVERS);
}

export function getDefaultLandingContent() {
  return {
    hero: {
      eyebrow: 'Şimdi teripli olma zamanı',
      title: 'Akademik Yazımın Yeni Adresi',
      subtitle: 'Tez, makale ve bildirilerinizi Tertip ile düzenleyin. Kütüphane, atıf ve AI destekli yazım tek platformda.',
      ctaText: 'Ücretsiz Başla',
      ctaLink: '/register',
      secondaryCtaText: 'Giriş Yap',
      secondaryCtaLink: '/login',
    },
    features: [
      {
        title: 'Akademik Editör',
        description: 'A4 sayfa düzeni, dipnot, kaynakça ve bölüm yönetimi.',
        icon: 'file-text',
      },
      {
        title: 'Kaynak Kütüphanesi',
        description: 'PDF ve kaynaklarınızı Google Drive ile senkronize edin.',
        icon: 'book',
      },
      {
        title: 'AI Destekli Yazım',
        description: 'Sesli not, OCR ve dil düzeltme araçları.',
        icon: 'sparkles',
      },
    ],
    conveniences: {
      title: 'Sistem Kolaylıkları',
      subtitle: 'Tertip, akademik yazım sürecinizin her adımında size zaman kazandırır.',
      items: [
        {
          id: 'voice-writing',
          icon: 'microphone',
          title: 'Konuşarak içerik yazma',
          description:
            'Düşüncelerinizi sesli olarak aktarın; yapay zeka konuşmanızı akademik üsluba uygun metne dönüştürür. Tez ve makale yazımında hız kazanın, not alma sürecini kolaylaştırın.',
          videoUrl: '',
        },
        {
          id: 'camera-footnote',
          icon: 'camera',
          title: 'Cep telefonu kamerası ile dipnot referansı oluşturma',
          description:
            'Kitap veya makale sayfasının fotoğrafını çekin; sistem OCR ile metni okur ve dipnot referansını otomatik oluşturur. Kütüphanede veya sahada anında atıf ekleyin.',
          videoUrl: '',
        },
        {
          id: 'footnote-rules',
          icon: 'bookmark',
          title: 'Dipnotların yazım kurallarını otomatik kontrol etme ve hazırlama',
          description:
            'Türkçe akademik dipnot kurallarına uygunluk otomatik denetlenir. Eksik veya hatalı biçimlendirmeler düzeltilir; tutarlı ve kurallara uygun dipnotlar hazırlanır.',
          videoUrl: '',
        },
        {
          id: 'appendix-auto',
          icon: 'files',
          title: 'Ekler sayfasını otomatik oluşturma',
          description:
            'Projedeki ek materyaller düzenli bir ekler bölümünde toplanır. Sayfa düzeni ve numaralandırma otomatik uygulanır.',
          videoUrl: '',
        },
        {
          id: 'toc-auto',
          icon: 'list-numbers',
          title: 'İçindekiler sayfasını otomatik oluşturma',
          description:
            'Başlıklar ve bölümler taranarak içindekiler sayfası otomatik üretilir. Manuel güncelleme ihtiyacı ortadan kalkar.',
          videoUrl: '',
        },
        {
          id: 'abstract-auto',
          icon: 'article',
          title: 'Tez yazımından sonra otomatik öz metni oluşturma',
          description:
            'Ana metin tamamlandığında yapay zeka, çalışmanızın özetini Türkçe öz bölümü için otomatik hazırlar. Ana argümanlar ve bulgular özetlenir.',
          videoUrl: '',
        },
        {
          id: 'abstract-translate',
          icon: 'language',
          title: 'Öz metnini abstract bölümüne otomatik tercüme etme',
          description:
            'Hazırlanan Türkçe öz metni, akademik İngilizce abstract bölümüne otomatik çevrilir. Uluslararası yayın gereksinimlerine uyum sağlar.',
          videoUrl: '',
        },
        {
          id: 'bibliography-auto',
          icon: 'books',
          title: 'Kaynakçayı dipnot referanslarını kullanarak otomatik oluşturma',
          description:
            'Metindeki tüm dipnotlar taranır ve MLA uyumlu kaynakça listesi otomatik oluşturulur. Tekrarlayan kayıtlar birleştirilir, alfabetik sıralama uygulanır.',
          videoUrl: '',
        },
        {
          id: 'image-ocr',
          icon: 'photo-scan',
          title: 'Görselleri OCR ile metne dönüştürme',
          description:
            'Taranmış sayfalar, ekran görüntüleri ve fotoğraflardaki metinler OCR ile okunur ve düzenlenebilir metne aktarılır.',
          videoUrl: '',
        },
        {
          id: 'ottoman-transcript',
          icon: 'old',
          title: 'Osmanlıca matbu metinleri otomatik transkript etme',
          description:
            'Osmanlı Türkçesi matbu metinler yapay zeka ile modern Türkçe harflere transkript edilir. Arşiv ve tarih çalışmalarında hız kazandırır.',
          videoUrl: '',
        },
        {
          id: 'web-research',
          icon: 'world-search',
          title: 'Yapay zeka aracılığıyla genel ağdan bilgi toplama / kaynak taraması',
          description:
            'Konunuzla ilgili güncel kaynaklar ve bilgiler yapay zeka destekli tarama ile keşfedilir. Literatür taramasına hızlı başlangıç yapın.',
          videoUrl: '',
        },
      ],
    },
    pricing: [
      {
        name: 'Başlangıç',
        price: 'Ücretsiz',
        period: '',
        description: 'Temel özellikler ve sınırlı AI kotası.',
        features: ['3 proje', '500K AI token', 'Google Drive entegrasyonu'],
        ctaText: 'Kayıt Ol',
        ctaLink: '/register',
        highlighted: false,
      },
      {
        name: 'Pro',
        price: '₺[PAYMENT_AMOUNT]',
        period: '/ay',
        description: 'Genişletilmiş AI kotası ve öncelikli destek.',
        features: ['Sınırsız proje', 'Aylık AI komut kotası', 'Öncelikli destek'],
        ctaText: 'Satın Al',
        ctaLink: '/register',
        highlighted: true,
      },
    ],
    bankInfo: {
      title: 'Havale / EFT Bilgileri',
      bankName: 'Örnek Banka',
      accountHolder: 'Tertip Yazılım Ltd. Şti.',
      iban: 'TR00 0000 0000 0000 0000 0000 00',
      description: 'Ödeme sonrası referans kodunuzu belirtmeyi unutmayın.',
    },
    footer: {
      copyright: '© 2026 Tertip. Tüm hakları saklıdır.',
      contactEmail: 'info@tertip.com',
    },
    meta: {
      pageTitle: 'Tertip — Akademik Yazım Platformu',
      description: 'Tez ve makale yazımı için modern akademik editör.',
    },
  };
}

export function normalizeLandingContent(data) {
  const defaults = getDefaultLandingContent();
  if (!data || typeof data !== 'object') return defaults;

  const conveniences = data.conveniences ?? {};
  const defaultItems = defaults.conveniences.items;
  const items = Array.isArray(conveniences.items) && conveniences.items.length > 0
    ? conveniences.items
    : defaultItems;

  return {
    hero: { ...defaults.hero, ...(data.hero ?? {}) },
    features: Array.isArray(data.features) ? data.features : defaults.features,
    conveniences: {
      title: conveniences.title ?? defaults.conveniences.title,
      subtitle: conveniences.subtitle ?? defaults.conveniences.subtitle,
      items: items.map((item, index) => {
        const def = defaultItems.find((d) => d.id === item.id) ?? defaultItems[index] ?? {};
        return {
          ...def,
          ...item,
          icon: item.icon || def.icon,
        };
      }),
    },
    pricing: Array.isArray(data.pricing) ? data.pricing : defaults.pricing,
    bankInfo: { ...defaults.bankInfo, ...(data.bankInfo ?? {}) },
    footer: { ...defaults.footer, ...(data.footer ?? {}) },
    meta: { ...defaults.meta, ...(data.meta ?? {}) },
  };
}
