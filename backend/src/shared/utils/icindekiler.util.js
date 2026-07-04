const CHAPTER_ORDINALS = [
  'BİRİNCİ',
  'İKİNCİ',
  'ÜÇÜNCÜ',
  'DÖRDÜNCÜ',
  'BEŞİNCİ',
  'ALTINCI',
  'YEDİNCİ',
  'SEKİZİNCİ',
  'DOKUZUNCU',
  'ONUNCU',
  'ON BİRİNCİ',
  'ON İKİNCİ',
  'ON ÜÇÜNCÜ',
  'ON DÖRDÜNCÜ',
  'ON BEŞİNCİ',
];

const FRONT_MATTER_TOC_SECTION_MAP = {
  ÖZ: 'oz',
  ABSTRACT: 'abstract',
  ÖNSÖZ: 'onsoz',
  'EKLER LİSTESİ': 'ekler',
  'KISALTMALAR LİSTESİ': 'kisaltmalar',
  GİRİŞ: 'body',
};

const BACK_MATTER_TOC_SECTION_MAP = {
  SONUÇ: 'sonuc',
  KAYNAKÇA: 'kaynakca',
  EKLER: 'ekler_end',
};

function extractNodeText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text ?? '';
  return (node.content ?? []).map(extractNodeText).join('');
}

function isIntroductionHeading(title) {
  const norm = String(title ?? '').trim().toLocaleUpperCase('tr-TR');
  return norm === 'GİRİŞ' || norm === 'GIRIŞ' || norm === 'GIRIS';
}

function isConclusionHeading(title) {
  const norm = String(title ?? '').trim().toLocaleUpperCase('tr-TR');
  return norm === 'SONUÇ' || norm === 'SONUC' || norm.startsWith('SONUÇ VE') || norm.startsWith('SONUC VE');
}

/** Ana metindeki "1.1.", "2.3.1 " gibi önek numaraları ayırır (İkinci sistem). */
export function stripHeadingNumberPrefix(title) {
  const trimmed = String(title ?? '').trim();
  if (!trimmed) return '';

  const without = trimmed.replace(/^\d+(?:\.\d+)*\.?\s+/, '').trim();
  return without || trimmed;
}

export function formatChapterLabel(chapterIndex) {
  const ordinal = CHAPTER_ORDINALS[chapterIndex - 1] ?? `${chapterIndex}.`;
  return `${ordinal} BÖLÜM`;
}

function toLowerRoman(num) {
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
  if (Number.isFinite(bodyStart) && bodyStart > 0 && page >= bodyStart) {
    return String(page - bodyStart + 1);
  }
  return toLowerRoman(page);
}

function resolvePageFromMap(pageMap, sectionSlug) {
  const pageIndex = pageMap?.sectionPages?.[sectionSlug];
  if (!Number.isFinite(Number(pageIndex))) return '';
  return formatThesisTocPage(pageIndex, pageMap?.bodyStartPage);
}

function resolveHeadingPageFromMap(pageMap, section, headingIndex) {
  const key = `${section}:${headingIndex}`;
  let pageIndex = pageMap?.headingPages?.[key];
  if (!Number.isFinite(Number(pageIndex))) return '';

  const bodyStart = Number(pageMap?.bodyStartPage);
  if (section === 'body' && Number.isFinite(bodyStart) && pageIndex < bodyStart) {
    pageIndex = bodyStart;
  }

  return formatThesisTocPage(pageIndex, pageMap?.bodyStartPage);
}

/** Tez hazırlama yönergesi: BİRİNCİ BÖLÜM öncesinde yer alan standart ön bölüm satırları. */
export const STANDARD_FRONT_MATTER_TOC_TITLES = [
  'ÖZ',
  'ABSTRACT',
  'ÖNSÖZ',
  'EKLER LİSTESİ',
  'KISALTMALAR LİSTESİ',
  'GİRİŞ',
];

export function buildStandardFrontMatterTocEntries(pageMap = null) {
  return STANDARD_FRONT_MATTER_TOC_TITLES.map((title) => {
    const sectionSlug = FRONT_MATTER_TOC_SECTION_MAP[title];
    let page = '';
    if (pageMap && sectionSlug) {
      page = title === 'GİRİŞ'
        ? '1'
        : resolvePageFromMap(pageMap, sectionSlug);
    }
    return { variant: 'intro', title, page };
  });
}

/** Tez sonu: Ana metin bölümlerinden sonra yer alan standart satırlar. */
export const STANDARD_BACK_MATTER_TOC_TITLES = ['SONUÇ', 'KAYNAKÇA', 'EKLER'];

export function buildStandardBackMatterTocEntries(pageMap = null) {
  return STANDARD_BACK_MATTER_TOC_TITLES.map((title) => {
    const sectionSlug = BACK_MATTER_TOC_SECTION_MAP[title];
    const page = pageMap && sectionSlug ? resolvePageFromMap(pageMap, sectionSlug) : '';
    return { variant: 'intro', title, page };
  });
}

export function collectHeadingsFromDoc(doc, { section = 'body' } = {}) {
  const headings = [];
  let headingIndex = 0;

  function walk(nodes) {
    for (const node of nodes ?? []) {
      if (node.type === 'heading') {
        const level = Number(node.attrs?.level) || 1;
        if (level >= 1 && level <= 3) {
          headings.push({
            section,
            headingIndex,
            level,
            title: extractNodeText(node).trim(),
          });
          headingIndex += 1;
        }
        continue;
      }

      if (node.type === 'paragraph') continue;

      if (node.type === 'blockquote') {
        walk(node.content);
        continue;
      }

      if (node.type === 'bulletList' || node.type === 'orderedList') {
        for (const item of node.content ?? []) {
          walk(item.content);
        }
        continue;
      }

      if (node.type === 'table') {
        for (const row of node.content ?? []) {
          for (const cell of row.content ?? []) {
            walk(cell.content);
          }
        }
      }
    }
  }

  walk(doc?.content);
  return headings;
}

export function buildTocEntriesFromHeadings(headings, pageMap = null) {
  const entries = [...buildStandardFrontMatterTocEntries(pageMap)];
  let chapterIndex = 0;
  const counters = [0, 0, 0];

  function ensureChapter() {
    if (chapterIndex === 0) {
      chapterIndex = 1;
      counters[0] = 1;
    }
  }

  for (const heading of headings) {
    const { level, title, section, headingIndex } = heading;
    if (!title) continue;

    const cleanTitle = stripHeadingNumberPrefix(title);

    if (level === 1 && isIntroductionHeading(title)) {
      continue;
    }

    if (level === 1 && isConclusionHeading(title)) {
      continue;
    }

    if (level === 1) {
      chapterIndex += 1;
      counters[0] = chapterIndex;
      counters[1] = 0;
      counters[2] = 0;
      entries.push({
        variant: 'chapter',
        chapterLabel: formatChapterLabel(chapterIndex),
        title: cleanTitle.toLocaleUpperCase('tr-TR'),
      });
      continue;
    }

    ensureChapter();
    counters[level - 1] += 1;
    for (let i = level; i < 3; i += 1) {
      counters[i] = 0;
    }

    const number = counters.slice(0, level).join('.');
    const page = pageMap
      ? resolveHeadingPageFromMap(pageMap, section ?? 'body', headingIndex)
      : '';

    entries.push({
      variant: 'item',
      number,
      title: cleanTitle,
      page,
      level,
    });
  }

  entries.push(...buildStandardBackMatterTocEntries(pageMap));

  return entries;
}

function centeredIcindekilerTitle() {
  return {
    type: 'heading',
    attrs: { level: 2, textAlign: 'center' },
    content: [{ type: 'text', text: 'İÇİNDEKİLER', marks: [{ type: 'bold' }] }],
  };
}

export function buildIcindekilerDocFromHeadings(headings, pageMap = null) {
  const entries = buildTocEntriesFromHeadings(headings, pageMap);

  return {
    type: 'doc',
    content: [
      centeredIcindekilerTitle(),
      ...entries.map((entry) => ({
        type: 'tocEntry',
        attrs: {
          variant: entry.variant,
          chapterLabel: entry.chapterLabel ?? '',
          number: entry.number ?? '',
          title: entry.title ?? '',
          page: entry.page ?? '',
          level: entry.level ?? 1,
        },
      })),
    ],
  };
}
