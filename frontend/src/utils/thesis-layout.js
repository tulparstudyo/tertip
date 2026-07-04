/** Google Docs / editör ile uyumlu A4 tez layout sabitleri */

export const THESIS_PAGE_WIDTH_MM = 210;
export const THESIS_PAGE_HEIGHT_MM = 297;
export const THESIS_PADDING_X_MM = 25;
export const THESIS_PADDING_Y_MM = 20;
export const THESIS_CONTENT_WIDTH_MM = THESIS_PAGE_WIDTH_MM - 2 * THESIS_PADDING_X_MM;
export const THESIS_CONTENT_HEIGHT_MM = THESIS_PAGE_HEIGHT_MM - 2 * THESIS_PADDING_Y_MM;

export const THESIS_BODY_FONT_PT = 12;
export const THESIS_HEADING_FONT_PT = 14;
export const THESIS_LINE_HEIGHT = 1.625;
export const THESIS_PARAGRAPH_SPACE_MM = 3;

/** Birleştirilmiş belge sırası (Google Docs export ile aynı; icindekiler dahil). */
export const THESIS_PAGINATION_SECTION_ORDER = [
  'kapak',
  'oz',
  'abstract',
  'onsoz',
  'ekler',
  'kisaltmalar',
  'icindekiler',
  'body',
  'sonuc',
  'kaynakca',
];

export const THESIS_SECTION_LABELS = {
  kapak: 'Kapak',
  oz: 'Öz',
  abstract: 'Abstract',
  onsoz: 'Önsöz',
  ekler: 'Ekler Listesi',
  kisaltmalar: 'Kısaltmalar Listesi',
  icindekiler: 'İçindekiler',
  body: 'Ana Metin',
  sonuc: 'Sonuç',
  kaynakca: 'Kaynakça',
};

export const FRONT_MATTER_TOC_SECTION_MAP = {
  ÖZ: 'oz',
  ABSTRACT: 'abstract',
  ÖNSÖZ: 'onsoz',
  'EKLER LİSTESİ': 'ekler',
  'KISALTMALAR LİSTESİ': 'kisaltmalar',
  GİRİŞ: 'body',
};

export const BACK_MATTER_TOC_SECTION_MAP = {
  SONUÇ: 'sonuc',
  KAYNAKÇA: 'kaynakca',
  EKLER: 'ekler_end',
};

export function mmToPx(mm) {
  return (mm * 96) / 25.4;
}

export function toLowerRoman(num) {
  const n = Number(num);
  if (!Number.isFinite(n) || n <= 0) return '';
  const map = [
    ['', 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix'],
    ['', 'x', 'xx', 'xxx', 'xl', 'l', 'lx', 'lxx', 'lxxx', 'xc'],
    ['', 'c', 'cc', 'ccc', 'cd', 'd', 'dc', 'dcc', 'dccc', 'cm'],
  ];
  let remaining = Math.floor(n);
  let result = '';
  for (let group = 0; group < map.length; group += 1) {
    result = map[group][remaining % 10] + result;
    remaining = Math.floor(remaining / 10);
  }
  return result;
}

/** Birleşik belgedeki 1 tabanlı sayfa indeksini tez içindekiler formatına çevirir. */
export function formatThesisTocPage(pageIndex, bodyStartPage) {
  const page = Number(pageIndex);
  const bodyStart = Number(bodyStartPage);
  if (!Number.isFinite(page) || page <= 0) return '';
  if (Number.isFinite(bodyStart) && page >= bodyStart) {
    return String(page - bodyStart + 1);
  }
  return toLowerRoman(page);
}
