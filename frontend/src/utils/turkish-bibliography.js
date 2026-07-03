import { formatAuthorMla, resolveAuthorFields } from './author-citation.js';
import { isCustomFootnote } from './turkish-footnote.js';

function formatVolumeIssue(source) {
  let part = '';
  if (source.volume) part += `C.${source.volume}`;
  if (source.issue) part += `${part ? ' ' : ''}S.${source.issue}`;
  return part ? `, ${part}` : '';
}

function formatPages(pages) {
  if (!pages) return '';
  const value = String(pages).trim();
  return value ? `, s.${value}` : '';
}

export function formatTurkishBibliographyEntry(source) {
  const authorLabel = formatAuthorMla(source);
  const { lastName, firstName } = resolveAuthorFields(source);
  const sortKey = `${lastName} ${firstName}`.trim().toLocaleLowerCase('tr-TR');
  const year = source.publicationYear ?? 't.y.';
  const detailRuns = [];

  if (source.sourceType === 'article') {
    detailRuns.push({ text: `"${source.title}", `, bold: false });
    detailRuns.push({ text: source.publisher?.trim() || 'Dergi adı', bold: true });
    detailRuns.push({ text: `${formatVolumeIssue(source)}, ${year}${formatPages(source.pages)}`, bold: false });
  } else if (source.sourceType === 'encyclopedia') {
    detailRuns.push({ text: `"${source.title}", `, bold: false });
    detailRuns.push({ text: source.publisher?.trim() || 'Ansiklopedi', bold: true });
    let suffix = '';
    if (source.volume) suffix += `, C.${source.volume}`;
    if (source.publicationPlace?.trim()) suffix += `, ${source.publicationPlace.trim()}`;
    suffix += `, ${year}${formatPages(source.pages)}`;
    detailRuns.push({ text: suffix, bold: false });
  } else {
    detailRuns.push({ text: source.title, bold: true });
    const place = source.publicationPlace?.trim();
    const publisher = source.publisher?.trim() || 'Yayınevi';
    const suffix = place ? `, ${place}, ${publisher}, ${year}` : `, ${publisher}, ${year}`;
    detailRuns.push({ text: suffix, bold: false });
  }

  return {
    sourceId: source.id ?? null,
    authorLabel,
    sortKey,
    detailRuns,
  };
}

export function sortBibliographyEntries(entries) {
  return [...entries].sort((a, b) => {
    const byKey = a.sortKey.localeCompare(b.sortKey, 'tr-TR');
    if (byKey !== 0) return byKey;
    return a.authorLabel.localeCompare(b.authorLabel, 'tr-TR');
  });
}

export function collectFootnoteSourceIds(doc) {
  const ids = [];

  function walk(nodes) {
    for (const node of nodes ?? []) {
      if (node.type === 'academicFootnote') {
        if (isCustomFootnote(node.attrs)) continue;
        if (node.attrs?.sourceId != null) {
          ids.push(Number(node.attrs.sourceId));
        }
      }
      if (node.content) walk(node.content);
    }
  }

  walk(doc?.content);
  return ids;
}

export function uniqueSourceIds(ids) {
  const seen = new Set();
  const unique = [];
  for (const id of ids) {
    if (!Number.isFinite(id) || seen.has(id)) continue;
    seen.add(id);
    unique.push(id);
  }
  return unique;
}

export function buildKaynakcaDocFromEntries(entries) {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1, textAlign: 'center' },
        content: [{ type: 'text', text: 'KAYNAKÇA', marks: [{ type: 'bold' }] }],
      },
      ...entries.map(({ sourceId, authorLabel, sortKey, detailRuns }) => ({
        type: 'bibliographyEntry',
        attrs: { sourceId, authorLabel, sortKey, detailRuns },
      })),
    ],
  };
}
