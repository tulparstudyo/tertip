import * as XLSX from 'xlsx';
import { buildAuthorsDisplay } from '../utils/author-citation.util.js';

const VALID_SOURCE_TYPES = new Set([
  'book',
  'article',
  'newspaper',
  'encyclopedia',
  'thesis',
  'other',
]);

export const LIBRARY_EXCEL_COLUMNS = [
  { key: 'sourceType', headers: ['Kaynak Türü', 'Source Type', 'source_type', 'sourceType'] },
  { key: 'authorLastName', headers: ['Yazar Soyadı', 'Author Last Name', 'author_last_name', 'authorLastName', 'Soyad'] },
  { key: 'authorFirstName', headers: ['Yazar Adı', 'Author First Name', 'author_first_name', 'authorFirstName', 'Ad'] },
  { key: 'title', headers: ['Eser Adı', 'Başlık', 'Title', 'title', 'sourceTitle'] },
  { key: 'publisher', headers: ['Yayınevi', 'Dergi', 'Publisher', 'publisher', 'journal'] },
  { key: 'publicationPlace', headers: ['Basım Yeri', 'Publication Place', 'publication_place', 'publicationPlace', 'Yer'] },
  { key: 'publicationYear', headers: ['Yıl', 'Year', 'publication_year', 'publicationYear'] },
  { key: 'volume', headers: ['Cilt', 'Volume', 'volume'] },
  { key: 'issue', headers: ['Sayı', 'Issue', 'issue'] },
  { key: 'pages', headers: ['Sayfa Aralığı', 'Page Range', 'pages', 'pageRange'] },
];

const HEADER_TO_KEY = new Map();
for (const col of LIBRARY_EXCEL_COLUMNS) {
  for (const header of col.headers) {
    HEADER_TO_KEY.set(normalizeHeader(header), col.key);
  }
}

function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

export function normalizeMatchKey(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

export function buildSourceMatchKey({ authorFirstName, authorLastName, title, authors }) {
  const authorLabel = buildAuthorsDisplay({
    authorFirstName: authorFirstName ?? '',
    authorLastName: authorLastName ?? '',
    authors: authors ?? '',
  });
  return `${normalizeMatchKey(authorLabel)}\0${normalizeMatchKey(title)}`;
}

function parseYear(value) {
  if (value == null || value === '') return null;
  const num = Number.parseInt(String(value).trim(), 10);
  return Number.isFinite(num) ? num : null;
}

function cellValue(value) {
  if (value == null) return '';
  return String(value).trim();
}

function mapHeaderRow(row) {
  const mapping = {};
  row.forEach((header, index) => {
    const key = HEADER_TO_KEY.get(normalizeHeader(header));
    if (key) mapping[key] = index;
  });
  return mapping;
}

function rowToPayload(row, columnMap) {
  const get = (key) => {
    const index = columnMap[key];
    if (index == null) return '';
    return cellValue(row[index]);
  };

  const sourceTypeRaw = get('sourceType').toLowerCase();
  const sourceType = VALID_SOURCE_TYPES.has(sourceTypeRaw) ? sourceTypeRaw : 'book';
  const title = get('title');

  if (!title) return null;

  return {
    sourceType,
    authorLastName: get('authorLastName'),
    authorFirstName: get('authorFirstName'),
    title,
    publisher: get('publisher') || null,
    publicationPlace: get('publicationPlace') || null,
    publicationYear: parseYear(get('publicationYear')),
    volume: get('volume') || null,
    issue: get('issue') || null,
    pages: get('pages') || null,
  };
}

export function parseLibraryExcelBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('EMPTY_WORKBOOK');
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  if (!rows.length) {
    throw new Error('EMPTY_SHEET');
  }

  const columnMap = mapHeaderRow(rows[0]);
  if (columnMap.title == null) {
    throw new Error('MISSING_TITLE_COLUMN');
  }

  const records = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || !row.some((cell) => cellValue(cell))) continue;
    const payload = rowToPayload(row, columnMap);
    if (payload) records.push(payload);
  }

  return records;
}

export function buildLibraryExcelBuffer(sources) {
  const headerRow = LIBRARY_EXCEL_COLUMNS.map((col) => col.headers[0]);
  const dataRows = sources.map((source) =>
    LIBRARY_EXCEL_COLUMNS.map((col) => {
      switch (col.key) {
        case 'sourceType':
          return source.source_type ?? source.sourceType ?? '';
        case 'authorLastName':
          return source.author_last_name ?? source.authorLastName ?? '';
        case 'authorFirstName':
          return source.author_first_name ?? source.authorFirstName ?? '';
        case 'title':
          return source.title ?? '';
        case 'publisher':
          return source.publisher ?? '';
        case 'publicationPlace':
          return source.publication_place ?? source.publicationPlace ?? '';
        case 'publicationYear':
          return source.publication_year ?? source.publicationYear ?? '';
        case 'volume':
          return source.volume ?? '';
        case 'issue':
          return source.issue ?? '';
        case 'pages':
          return source.pages ?? '';
        default:
          return '';
      }
    }),
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 42 },
    { wch: 28 },
    { wch: 16 },
    { wch: 8 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kaynaklar');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function buildMatchIndex(rows) {
  const index = new Map();
  for (const row of rows) {
    const key = buildSourceMatchKey({
      authorFirstName: row.author_first_name,
      authorLastName: row.author_last_name,
      title: row.title,
      authors: row.authors,
    });
    if (key.endsWith('\0')) continue;
    index.set(key, row);
  }
  return index;
}
