/**
 * MLA 9 citation formatting (Turkish labels in examples: cilt, no., s./ss.)
 */

import { formatAuthorMla } from './author-citation.js';

function formatPublisherPart(source) {
  const publisher = source.publisher?.trim() || 'Yayınevi';
  const place = source.publicationPlace?.trim();
  if (place) return `${place}: ${publisher}`;
  return publisher;
}

export function formatMlaBibliography(source) {
  const authors = formatAuthorMla(source);
  const year = source.publicationYear ?? 't.y.';

  if (source.sourceType === 'article') {
    const journal = source.publisher?.trim() || 'Dergi adı';
    let citation = `${authors}. "${source.title}". ${journal}`;

    if (source.volume) {
      citation += `, cilt ${source.volume}`;
    }
    if (source.issue) {
      citation += `, no. ${source.issue}`;
    }

    citation += `, ${year}`;

    if (source.pages) {
      citation += `, ss. ${source.pages}`;
    }

    return `${citation}.`;
  }

  return `${authors}. ${source.title}. ${formatPublisherPart(source)}, ${year}.`;
}

/** Footnote citation: bibliography entry + cited page number */
export function formatMlaFootnote(source, pageNumber) {
  const authors = formatAuthorMla(source);
  const year = source.publicationYear ?? 't.y.';
  const pageSuffix = pageNumber ? `, s. ${pageNumber}` : '';

  if (source.sourceType === 'article') {
    const journal = source.publisher?.trim() || 'Dergi adı';
    let citation = `${authors}. "${source.title}". ${journal}`;

    if (source.volume) {
      citation += `, cilt ${source.volume}`;
    }
    if (source.issue) {
      citation += `, no. ${source.issue}`;
    }

    citation += `, ${year}${pageSuffix}`;
    return `${citation}.`;
  }

  return `${authors}. ${source.title}. ${formatPublisherPart(source)}, ${year}${pageSuffix}.`;
}
