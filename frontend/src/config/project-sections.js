/** Editable project section slugs (URL segment after /editor/) */
export const PROJECT_SECTION_SLUGS = [
  'kapak',
  'oz',
  'abstract',
  'onsoz',
  'ekler',
  'kisaltmalar',
  'icindekiler',
  'body',
  'kaynakca',
];

export const DEFAULT_PROJECT_SECTION = 'body';

export function isValidProjectSection(section) {
  return PROJECT_SECTION_SLUGS.includes(section);
}

/** Per-section toolbar capabilities */
export const EDITOR_SECTION_CONFIG = {
  body: {
    footnotes: true,
    imageCitations: true,
    checkFootnotes: true,
    ai: true,
    headings: [1, 2, 3],
    bold: true,
    italic: true,
    bulletList: true,
    orderedList: true,
    blockquote: true,
  },
  kapak: {
    footnotes: false,
    ai: false,
    headings: [1, 2],
    bold: true,
    italic: true,
    bulletList: false,
    orderedList: false,
    blockquote: false,
  },
  oz: {
    footnotes: false,
    ai: true,
    generateOz: true,
    headings: [2],
    bold: true,
    italic: true,
    bulletList: false,
    orderedList: false,
    blockquote: false,
  },
  abstract: {
    footnotes: false,
    ai: true,
    generateAbstract: true,
    headings: [2],
    bold: true,
    italic: true,
    bulletList: false,
    orderedList: false,
    blockquote: false,
  },
  onsoz: {
    footnotes: true,
    ai: true,
    headings: [1, 2],
    bold: true,
    italic: true,
    bulletList: true,
    orderedList: false,
    blockquote: true,
  },
  ekler: {
    footnotes: false,
    ai: false,
    headings: [],
    bold: false,
    italic: false,
    bulletList: false,
    orderedList: false,
    blockquote: false,
    appendixEntries: true,
  },
  kisaltmalar: {
    footnotes: false,
    ai: false,
    headings: [2],
    bold: true,
    italic: true,
    bulletList: true,
    orderedList: false,
    blockquote: false,
    standardAbbreviations: true,
  },
  icindekiler: {
    footnotes: false,
    ai: false,
    headings: [2],
    bold: true,
    italic: false,
    bulletList: true,
    orderedList: true,
    blockquote: false,
  },
  kaynakca: {
    footnotes: false,
    ai: false,
    headings: [],
    bold: false,
    italic: false,
    bulletList: false,
    orderedList: false,
    blockquote: false,
    bibliographyEntries: true,
    generateKaynakca: true,
  },
};

export function getEditorSectionConfig(section) {
  return EDITOR_SECTION_CONFIG[section] ?? EDITOR_SECTION_CONFIG.body;
}
