import { resolveAuthorFields } from './author-citation.util.js';

const ROMAN_NUMERALS = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

function toRomanNumeral(value) {
  const n = parseInt(String(value).trim(), 10);
  if (!Number.isFinite(n) || n <= 0) return String(value).trim();
  let remaining = n;
  let result = '';
  for (const [val, sym] of ROMAN_NUMERALS) {
    while (remaining >= val) {
      result += sym;
      remaining -= val;
    }
  }
  return result;
}

function formatAuthorFootnote(source) {
  const { firstName, lastName } = resolveAuthorFields(source);
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (lastName) return lastName;
  if (firstName) return firstName;
  return '';
}

function formatPageSuffix(pageNumber) {
  if (pageNumber == null || pageNumber === '') return '';
  return `, s. ${pageNumber}`;
}

function formatYear(source) {
  return source.publicationYear ?? 't.y.';
}

function formatPlace(source) {
  return source.publicationPlace?.trim() || 'y.y.';
}

function formatPublisher(source) {
  return source.publisher?.trim() || 'y.y.';
}

function formatEditionPart(source) {
  const edition = source.edition ?? source.printEdition;
  if (!edition) return '';
  const value = String(edition).trim();
  if (!value) return '';
  if (/^\d+\.?\s*bs/i.test(value) || /^bs/i.test(value)) return `${value.replace(/\.$/, '')}.`;
  if (/^\d+$/.test(value)) return `${value}. bs.`;
  return value.endsWith('.') ? value : `${value}.`;
}

function formatTranslatorPart(source) {
  const translator = source.translator?.trim() || source.translatorName?.trim();
  if (!translator) return '';
  return `Çev. ${translator}`;
}

function formatPeriodicalVolume(volume) {
  if (volume == null || volume === '') return '';
  const raw = String(volume).trim();
  if (/^C\./i.test(raw)) return raw;
  if (/^Vol\./i.test(raw)) return raw.replace(/^Vol\./i, 'C.');
  if (/^[IVXLCDM]+$/i.test(raw)) return `C.${raw.toUpperCase()}`;
  const num = parseInt(raw, 10);
  if (Number.isFinite(num) && num > 0) return `C.${toRomanNumeral(num)}`;
  return `C.${raw}`;
}

function formatPeriodicalIssue(issue) {
  if (issue == null || issue === '') return '';
  const raw = String(issue).trim();
  if (/^No:/i.test(raw)) return raw;
  if (/[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(raw)) return raw;
  return `No:${raw}`;
}

function joinParts(parts) {
  return parts.filter(Boolean).join(', ');
}

function formatBookFull(source, pageNumber) {
  const author = formatAuthorFootnote(source);
  const pageSuffix = formatPageSuffix(pageNumber);
  const title = source.title?.trim() || 'Başlıksız eser';
  const pubInfo = joinParts([
    formatEditionPart(source),
    formatTranslatorPart(source),
    formatPlace(source),
    formatPublisher(source),
    formatYear(source),
  ]);

  if (!author) {
    return `${title}, ${pubInfo}${pageSuffix}.`;
  }

  return `${author}, ${title}, ${pubInfo}${pageSuffix}.`;
}

function formatJournalArticleFull(source, pageNumber) {
  const author = formatAuthorFootnote(source);
  const pageSuffix = formatPageSuffix(pageNumber);
  const title = source.title?.trim() || 'Başlıksız makale';
  const journal = source.publisher?.trim() || 'Dergi adı';
  const authorPart = author ? `${author}, ` : '';

  const pubParts = [
    formatTranslatorPart(source),
    journal,
    formatPeriodicalVolume(source.volume),
    formatPeriodicalIssue(source.issue),
    formatYear(source),
  ].filter(Boolean);

  return `${authorPart}"${title}," ${joinParts(pubParts)}${pageSuffix}.`;
}

function formatEncyclopediaFull(source, pageNumber) {
  const author = formatAuthorFootnote(source);
  const pageSuffix = formatPageSuffix(pageNumber);
  const title = source.title?.trim() || 'Başlıksız madde';
  const name = source.publisher?.trim() || 'Ansiklopedi';
  const authorPart = author ? `${author}, ` : '';

  const pubParts = [
    name,
    formatPeriodicalVolume(source.volume),
    formatPlace(source),
    formatPublisher(source),
    formatYear(source),
  ].filter(Boolean);

  return `${authorPart}"${title}," ${joinParts(pubParts)}${pageSuffix}.`;
}

function formatThesisFull(source, pageNumber) {
  const author = formatAuthorFootnote(source);
  const pageSuffix = formatPageSuffix(pageNumber);
  const title = source.title?.trim() || 'Başlıksız tez';
  const authorPart = author ? `${author}, ` : '';
  const pubInfo = joinParts([
    formatPlace(source),
    formatPublisher(source),
    formatYear(source),
  ]);

  return `${authorPart}"${title}," ${pubInfo}${pageSuffix}.`;
}

function formatNewspaperFull(source, pageNumber) {
  const author = formatAuthorFootnote(source);
  const pageSuffix = formatPageSuffix(pageNumber);
  const title = source.title?.trim() || 'Başlıksız haber';
  const paper = source.publisher?.trim() || 'Gazete adı';
  const authorPart = author ? `${author}, ` : '';
  const datePart = source.issue?.trim() || formatYear(source);

  return `${authorPart}"${title}," ${paper}, ${datePart}${pageSuffix}.`;
}

/** İlk atıf — Madde 20 tam bibliyografik bilgi */
export function formatTurkishFootnoteFull(source, pageNumber) {
  const type = source.sourceType ?? 'book';

  switch (type) {
    case 'article':
      return formatJournalArticleFull(source, pageNumber);
    case 'encyclopedia':
      return formatEncyclopediaFull(source, pageNumber);
    case 'thesis':
      return formatThesisFull(source, pageNumber);
    case 'newspaper':
      return formatNewspaperFull(source, pageNumber);
    case 'book':
    case 'other':
    default:
      return formatBookFull(source, pageNumber);
  }
}
