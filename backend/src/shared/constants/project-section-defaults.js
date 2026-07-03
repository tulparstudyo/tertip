function toUpperTr(text) {
  return text?.toLocaleUpperCase('tr-TR') ?? '';
}

function thesisLevelLabel(level) {
  if (!level) return 'TEZİ';
  return `${toUpperTr(level)} TEZİ`;
}

function centeredParagraph(text, { bold = true, uppercase = true } = {}) {
  if (!text) {
    return { type: 'paragraph', attrs: { textAlign: 'center' } };
  }

  const textNode = {
    type: 'text',
    text: uppercase ? toUpperTr(text) : text,
  };

  if (bold) {
    textNode.marks = [{ type: 'bold' }];
  }

  return {
    type: 'paragraph',
    attrs: { textAlign: 'center' },
    content: [textNode],
  };
}

function centeredTitle(text, level = 2) {
  return {
    type: 'heading',
    attrs: { level, textAlign: 'center' },
    content: [
      {
        type: 'text',
        text: toUpperTr(text),
        marks: [{ type: 'bold' }],
      },
    ],
  };
}

function spacers(count = 1) {
  return Array.from({ length: count }, () => ({ type: 'paragraph', attrs: { textAlign: 'center' } }));
}

/** Turkish academic thesis cover layout (T.C. → university → title → author → advisor → city-year). */
export function buildThesisKapakDoc({ title, metadata = {} }) {
  const thesisTitle = metadata.thesisTitle || title;
  const levelLabel = thesisLevelLabel(metadata.thesisLevel);
  const cityYear =
    metadata.city && metadata.year
      ? `${toUpperTr(metadata.city)}-${metadata.year}`
      : toUpperTr(metadata.city) || metadata.year || '';

  return {
    type: 'doc',
    content: [
      centeredParagraph('T. C.'),
      centeredParagraph(metadata.university),
      centeredParagraph(metadata.institute),
      centeredParagraph(metadata.department),
      ...spacers(2),
      centeredParagraph(levelLabel),
      ...spacers(3),
      centeredTitle(thesisTitle),
      ...spacers(4),
      centeredParagraph(metadata.authorName, { uppercase: false }),
      centeredParagraph(metadata.studentNumber, { uppercase: false }),
      ...spacers(3),
      centeredParagraph('TEZ DANIŞMANI'),
      centeredParagraph(metadata.advisor, { uppercase: false }),
      ...spacers(2),
      centeredParagraph(cityYear),
    ],
  };
}

function heading(level, text) {
  return {
    type: 'heading',
    attrs: { level },
    content: text ? [{ type: 'text', text }] : [],
  };
}

export function parseGeneratedParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

export const OZ_SOURCE_CHAR_LIMIT = 50_000;

/** Keep öz generation fast and within model limits for very long theses. */
export function prepareOzSourceText(fullText) {
  const text = fullText.trim();
  if (!text) return { text: '', truncated: false };

  if (text.length <= OZ_SOURCE_CHAR_LIMIT) {
    return { text, truncated: false };
  }

  const half = Math.floor((OZ_SOURCE_CHAR_LIMIT - 20) / 2);
  return {
    text: `${text.slice(0, half)}\n\n[...]\n\n${text.slice(-half)}`,
    truncated: true,
  };
}

export function buildOzDocFromParagraphs(paragraphs) {
  const content = paragraphs
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((text) => ({
      type: 'paragraph',
      content: [{ type: 'text', text }],
    }));

  return {
    type: 'doc',
    content: [heading(2, 'ÖZ'), ...content],
  };
}

export function buildAbstractDocFromParagraphs(paragraphs) {
  const content = paragraphs
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((text) => ({
      type: 'paragraph',
      content: [{ type: 'text', text }],
    }));

  return {
    type: 'doc',
    content: [heading(2, 'Abstract'), ...content],
  };
}

const emptyParagraph = { type: 'paragraph' };

/** Ekler: ortalı H1 başlık. */
export function buildEklerListesiDoc() {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1, textAlign: 'center' },
        content: [{ type: 'text', text: 'EKLER', marks: [{ type: 'bold' }] }],
      },
    ],
  };
}

/** Kaynakça: ortalı H1 başlık. */
export function buildKaynakcaListesiDoc() {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1, textAlign: 'center' },
        content: [{ type: 'text', text: 'KAYNAKÇA', marks: [{ type: 'bold' }] }],
      },
    ],
  };
}

/** Default Tiptap JSON per section. */
export function buildDefaultSectionDoc(section, context = {}) {
  const title = typeof context === 'string' ? context : context.title ?? '';
  const projectType = typeof context === 'string' ? 'article' : context.projectType ?? 'article';
  const metadata = typeof context === 'string' ? {} : context.metadata ?? {};

  if (section === 'kapak' && projectType === 'thesis') {
    return buildThesisKapakDoc({ title, metadata });
  }

  switch (section) {
    case 'kapak':
      return { type: 'doc', content: [heading(1, title), emptyParagraph] };
    case 'oz':
      return { type: 'doc', content: [heading(2, 'Öz'), emptyParagraph] };
    case 'abstract':
      return { type: 'doc', content: [heading(2, 'Abstract'), emptyParagraph] };
    case 'onsoz':
      return { type: 'doc', content: [heading(1, 'Önsöz'), emptyParagraph] };
    case 'ekler':
      return buildEklerListesiDoc();
    case 'kisaltmalar':
      return { type: 'doc', content: [heading(2, 'Kısaltmalar'), emptyParagraph] };
    case 'icindekiler':
      return { type: 'doc', content: [heading(2, 'İçindekiler'), emptyParagraph] };
    case 'kaynakca':
      return buildKaynakcaListesiDoc();
    case 'body':
    default:
      return { type: 'doc', content: [heading(1, title), emptyParagraph] };
  }
}

export function normalizeSectionDoc(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object') return raw;
  return null;
}
