import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { pool } from '../src/config/database.js';
import { buildAuthorsDisplay } from '../src/shared/utils/author-citation.util.js';

dotenv.config();

const USER_ID = 1;
const __dirname = dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = join(__dirname, '..', '..', '..', 'files', 'kaynakça.xlsx');

function readZipEntries(buffer) {
  const entries = {};
  let offset = 0;

  while (offset + 30 <= buffer.length) {
    const sig = buffer.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;

    const compMethod = buffer.readUInt16LE(offset + 8);
    const compSize = buffer.readUInt32LE(offset + 18);
    const fileNameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const name = buffer.subarray(offset + 30, offset + 30 + fileNameLen).toString('utf8');
    const dataStart = offset + 30 + fileNameLen + extraLen;
    let data = buffer.subarray(dataStart, dataStart + compSize);

    if (compMethod === 8) {
      data = inflateRawSync(data);
    }

    entries[name] = data;
    offset = dataStart + compSize;
  }

  return entries;
}

function xmlText(node) {
  if (!node) return '';
  let text = '';
  for (const child of node.childNodes ?? []) {
    if (child.nodeName === '#text') text += child.data ?? '';
    else if (child.nodeName === 't') text += child.textContent ?? '';
  }
  return text;
}

function readXlsxRows(filePath) {
  const buffer = readFileSync(filePath);
  const entries = readZipEntries(buffer);
  const sharedXml = entries['xl/sharedStrings.xml']?.toString('utf8') ?? '';
  const sheetXml = entries['xl/worksheets/sheet1.xml']?.toString('utf8') ?? '';

  const sharedStrings = [];
  for (const match of sharedXml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)) {
    const inner = match[1];
    const parts = [...inner.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => m[1]);
    sharedStrings.push(parts.join(''));
  }

  const rows = [];
  for (const rowMatch of sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const rowInner = rowMatch[1];
    const cells = [];
    let colIndex = 0;

    for (const cellMatch of rowInner.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1];
      const ref = attrs.match(/\br="([A-Z]+)(\d+)"/)?.[1] ?? '';
      const targetIndex = ref ? ref.charCodeAt(0) - 65 : colIndex;
      while (cells.length < targetIndex) cells.push('');
      const type = attrs.match(/\bt="([^"]+)"/)?.[1];
      const value = cellMatch[2].match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? '';
      cells[targetIndex] = type === 's' ? sharedStrings[Number(value)] ?? '' : value;
      colIndex = targetIndex + 1;
    }

    if (cells.some(Boolean)) rows.push(cells);
  }

  return rows;
}

function parseAuthor(raw) {
  let text = String(raw ?? '').trim().replace(/:\s*$/, '');
  const colonIdx = text.indexOf(':');
  if (colonIdx > 0 && text.indexOf(',') < colonIdx) {
    text = text.slice(0, colonIdx).trim();
  }

  const comma = text.indexOf(',');
  if (comma === -1) {
    return { authorLastName: text, authorFirstName: '' };
  }

  return {
    authorLastName: text.slice(0, comma).trim(),
    authorFirstName: text.slice(comma + 1).trim(),
  };
}

function extractTitle(info) {
  const quoted = info.match(/^["“«''](.+?)["”»''],?\s*/);
  if (quoted) {
    return { title: quoted[1].trim(), rest: info.slice(quoted[0].length).trim() };
  }

  const comma = info.indexOf(',');
  if (comma === -1) return { title: info.trim(), rest: '' };
  return { title: info.slice(0, comma).trim(), rest: info.slice(comma + 1).trim() };
}

function parseYear(text) {
  const matches = [...text.matchAll(/\b(1[0-9]{3}|2[0-9]{3})\b/g)];
  if (!matches.length) return null;
  return Number(matches[matches.length - 1][1]);
}

function parsePages(text) {
  const match = text.match(/,\s*s[\.\-]?\s*([\d\-–—]+(?:\s*-\s*[\d\-–—]+)?)/i);
  return match ? match[1].replace(/\s+/g, '') : null;
}

function parseVolumeIssue(text) {
  const match = text.match(/C\.?\s*([^,]+?)(?:\s+S\.?\s*([^,]+))?/i);
  if (!match) return { volume: null, issue: null, before: text };
  return {
    volume: match[1]?.trim() || null,
    issue: match[2]?.trim() || null,
    before: text.slice(0, match.index).replace(/,\s*$/, ''),
  };
}

function detectSourceType(info) {
  const low = info.toLowerCase();
  if (/ansikloped/i.test(low)) return 'encyclopedia';
  if (/,\s*s[\.\-]?\s*\d/i.test(info) && /C\.?\s*\S+/i.test(info)) return 'article';
  if (/dergi|mecmu|dergisi|tetkikleri|yazılar/i.test(low) && /C\.?\s*\S+/i.test(info)) return 'article';
  if (/^["“«]/.test(info) && /,\s*s[\.\-]?\s*\d/i.test(info)) return 'article';
  return 'book';
}

function parseSource(authorRaw, infoRaw) {
  const info = String(infoRaw ?? '').trim();
  if (!info) return null;

  const { authorLastName, authorFirstName } = parseAuthor(authorRaw);
  const sourceType = detectSourceType(info);
  const { title, rest } = extractTitle(info);
  const publicationYear = parseYear(info);
  const pages = parsePages(info);

  const payload = {
    sourceType,
    title,
    authorFirstName,
    authorLastName,
    publisher: null,
    publicationPlace: null,
    publicationYear,
    volume: null,
    issue: null,
    pages,
  };

  if (sourceType === 'book') {
    const parts = rest.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      payload.publicationPlace = parts.slice(0, -2).join(', ');
      payload.publisher = parts[parts.length - 2];
    } else if (parts.length === 2) {
      payload.publicationPlace = parts[0];
      payload.publisher = parts[1];
    } else if (parts.length === 1) {
      payload.publisher = parts[0];
    }
    return payload;
  }

  const { volume, issue, before } = parseVolumeIssue(rest);
  payload.volume = volume;
  payload.issue = issue;
  payload.publisher = before.replace(/,\s*$/, '').trim() || null;

  if (sourceType === 'encyclopedia' && !payload.volume) {
    const vol = rest.match(/C\.?\s*([^,]+)/i);
    payload.volume = vol?.[1]?.trim() ?? null;
  }

  return payload;
}

async function insertSource(userId, payload) {
  const authors = buildAuthorsDisplay(payload);
  await pool.query(
    `INSERT INTO sources
       (user_id, source_type, title, authors, author_first_name, author_last_name,
        publisher, publication_place, publication_year, volume, issue, pages)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      userId,
      payload.sourceType,
      payload.title,
      authors,
      payload.authorFirstName || null,
      payload.authorLastName || null,
      payload.publisher,
      payload.publicationPlace,
      payload.publicationYear,
      payload.volume,
      payload.issue,
      payload.pages,
    ],
  );
}

try {
  const rows = readXlsxRows(XLSX_PATH);
  const dataRows = rows.slice(1);
  let inserted = 0;
  let skipped = 0;

  for (const [author, info] of dataRows) {
    const payload = parseSource(author, info);
    if (!payload?.title) {
      skipped += 1;
      console.log('Skipped:', author);
      continue;
    }
    await insertSource(USER_ID, payload);
    inserted += 1;
  }

  console.log(`Import completed for user ${USER_ID}: ${inserted} inserted, ${skipped} skipped.`);
} catch (err) {
  console.error('Import failed:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
