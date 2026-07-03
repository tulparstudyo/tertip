import { formatAuthor } from './author-citation.util.js';

function formatPublisherPart(source) {
  const publisher = source.publisher?.trim() || 'Yayınevi';
  const place = source.publication_place?.trim() || source.publicationPlace?.trim();
  if (place) return `${place}: ${publisher}`;
  return publisher;
}

export function formatMlaFootnote(source, pageNumber) {
  const authors = formatAuthor(source, 'mla');
  const year = source.publication_year ?? source.publicationYear ?? 't.y.';
  const sourceType = source.source_type ?? source.sourceType;
  const title = source.title;
  const volume = source.volume;
  const issue = source.issue;
  const pageSuffix = pageNumber ? `, s. ${pageNumber}` : '';

  if (sourceType === 'article') {
    const journal = source.publisher?.trim() || 'Dergi adı';
    let citation = `${authors}. "${title}". ${journal}`;

    if (volume) citation += `, cilt ${volume}`;
    if (issue) citation += `, no. ${issue}`;

    citation += `, ${year}${pageSuffix}`;
    return `${citation}.`;
  }

  return `${authors}. ${title}. ${formatPublisherPart(source)}, ${year}${pageSuffix}.`;
}
