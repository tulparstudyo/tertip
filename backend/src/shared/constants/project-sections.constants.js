import { buildDefaultSectionDoc, normalizeSectionDoc } from './project-section-defaults.js';
import { getProjectContext } from './project-metadata.constants.js';

export const PROJECT_SECTIONS = {
  body: 'tiptap_content',
  kapak: 'tiptap_kapak',
  oz: 'tiptap_oz',
  abstract: 'tiptap_abstract',
  onsoz: 'tiptap_onsoz',
  ekler: 'tiptap_ekler',
  kisaltmalar: 'tiptap_kisaltmalar',
  icindekiler: 'tiptap_icindekiler',
  kaynakca: 'tiptap_kaynakca',
};

/** Order of sections in the merged Google Docs export */
export const GOOGLE_DOC_SYNC_ORDER = [
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

/** Section names used as H1 headers in merged Google Doc export (not duplicated in body). */
export const GOOGLE_DOC_SECTION_LABELS = {
  kapak: 'Kapak',
  oz: 'Öz',
  abstract: 'Abstract',
  onsoz: 'Önsöz',
  ekler: 'Ekler Listesi',
  kisaltmalar: 'Kısaltmalar Listesi',
  icindekiler: 'İçindekiler',
  body: 'Ana Metin',
  kaynakca: 'Kaynakça',
};

export const PROJECT_SECTION_SLUGS = Object.keys(PROJECT_SECTIONS);

export function resolveProjectSectionColumn(section) {
  return PROJECT_SECTIONS[section] ?? null;
}

export function getSectionContentFromProject(projectRow, section) {
  const column = resolveProjectSectionColumn(section);
  if (!column || !projectRow) return null;
  return normalizeSectionDoc(projectRow[column]);
}

export function resolveSectionContent(projectRow, section) {
  const stored = getSectionContentFromProject(projectRow, section);
  if (stored) return stored;
  return buildDefaultSectionDoc(section, getProjectContext(projectRow));
}

export function collectSectionsForGoogleDoc(projectRow) {
  return GOOGLE_DOC_SYNC_ORDER.map((section) => ({
    section,
    doc: resolveSectionContent(projectRow, section),
  }));
}
