import { google } from 'googleapis';
import { getDriveClientForUser } from './google-drive.service.js';
import {
  GOOGLE_DOC_SECTION_LABELS,
  GOOGLE_DOC_SYNC_ORDER,
} from '../constants/project-sections.constants.js';
import {
  isInvalidGrantError,
  isGoogleNetworkError,
  isInsufficientScopeError,
} from '../utils/google-token.util.js';

const BATCH_CHUNK_SIZE = 50;

/** Google Docs lineSpacing is a percentage of normal (100 = single, 150 = 1.5). */
const LINE_SPACING_ONE_AND_HALF = 150;

/** spaceBelow in pt — one line gap between paragraphs (Pragraftan sonra boşluk). */
const PARAGRAPH_SPACE_BELOW_PT = 12;

/** Tez yazı tipi: gövde 12pt, kısım/bölüm/altbölüm başlıkları 14pt. */
const THESIS_FONT_FAMILY = 'Times New Roman';
const THESIS_BODY_FONT_SIZE_PT = 12;
const THESIS_HEADING_FONT_SIZE_PT = 14;

function isHeadingNamedStyle(namedStyleType) {
  return namedStyleType !== 'NORMAL_TEXT';
}

function thesisFontSizePt(namedStyleType) {
  return isHeadingNamedStyle(namedStyleType)
    ? THESIS_HEADING_FONT_SIZE_PT
    : THESIS_BODY_FONT_SIZE_PT;
}

function buildThesisTextStyle(fontSizePt) {
  return {
    weightedFontFamily: { fontFamily: THESIS_FONT_FAMILY },
    fontSize: { magnitude: fontSizePt, unit: 'PT' },
  };
}

const THESIS_FONT_TEXT_STYLE_FIELDS = 'weightedFontFamily,fontSize';

/** A4 + 25mm kenar boşlukları (editör ile uyumlu). */
const THESIS_PAGE_SIZE = {
  width: { magnitude: 595.28, unit: 'PT' },
  height: { magnitude: 841.89, unit: 'PT' },
};
const THESIS_MARGIN_PT = 71;
const THESIS_CONTENT_WIDTH_PT = 595.28 - 2 * THESIS_MARGIN_PT;

/** Ekler satırı: içerik genişliğine göre nokta sayısı (~12pt TNR). */
const APPENDIX_CHAR_WIDTH_PT = 6;
const APPENDIX_LINE_CHAR_TARGET = Math.floor(THESIS_CONTENT_WIDTH_PT / APPENDIX_CHAR_WIDTH_PT) - 2;

const EKLER_HEADING_LABELS = new Set(['ekler', 'ekler listesi']);

function shouldAddSpaceBelow(textAlign) {
  return textAlign !== 'center';
}

const HEADING_STYLE = {
  1: 'HEADING_1',
  2: 'HEADING_2',
  3: 'HEADING_3',
  4: 'HEADING_4',
  5: 'HEADING_5',
  6: 'HEADING_6',
};

function parseRuns(content) {
  const runs = [];

  for (const node of content ?? []) {
    if (node.type === 'text') {
      const marks = node.marks ?? [];
      runs.push({
        text: node.text ?? '',
        bold: marks.some((m) => m.type === 'bold'),
        italic: marks.some((m) => m.type === 'italic'),
      });
      continue;
    }

    if (node.type === 'hardBreak') {
      runs.push({ text: '\n' });
      continue;
    }

    if (node.type === 'academicFootnote') {
      runs.push({
        type: 'footnote',
        citation:
          node.attrs?.formattedText ||
          `Kaynak #${node.attrs?.sourceId ?? '?'}, s. ${node.attrs?.pageNumber ?? '?'}`,
      });
      continue;
    }

    if (node.type === 'editorComment') {
      runs.push({
        type: 'comment',
        commentId: node.attrs?.commentId ?? null,
        commentText: node.attrs?.commentText ?? '',
        userName: node.attrs?.userName ?? '',
      });
    }
  }

  return runs;
}

function flattenBlockNode(node) {
  if (!node) return [];

  if (node.type === 'heading') {
    return [
      {
        type: 'heading',
        level: node.attrs?.level ?? 1,
        textAlign: node.attrs?.textAlign ?? null,
        runs: parseRuns(node.content),
      },
    ];
  }

  if (node.type === 'paragraph') {
    return [
      {
        type: 'paragraph',
        textAlign: node.attrs?.textAlign ?? null,
        runs: parseRuns(node.content),
      },
    ];
  }

  if (node.type === 'blockquote') {
    return (node.content ?? [])
      .flatMap(flattenBlockNode)
      .map((block) => ({ ...block, blockquote: true }));
  }

  if (node.type === 'bulletList' || node.type === 'orderedList') {
    const items = (node.content ?? []).map((listItem) =>
      (listItem.content ?? []).flatMap(flattenBlockNode),
    );
    return [{ type: 'list', ordered: node.type === 'orderedList', items }];
  }

  if (node.type === 'appendixEntry') {
    return [
      {
        type: 'appendixEntry',
        number: node.attrs?.number ?? 1,
        title: node.attrs?.title ?? '',
        page: String(node.attrs?.page ?? ''),
      },
    ];
  }

  if (node.type === 'bibliographyEntry') {
    return [
      {
        type: 'bibliographyEntry',
        authorLabel: node.attrs?.authorLabel ?? '',
        detailRuns: node.attrs?.detailRuns ?? [],
      },
    ];
  }

  return [];
}

function parseDocBlocks(doc) {
  return (doc.content ?? []).flatMap(flattenBlockNode);
}

export function tiptapJsonToPlainText(doc) {
  return parseDocBlocks(doc)
    .flatMap((block) => {
      if (block.type === 'list') {
        return block.items.flatMap((itemBlocks) =>
          itemBlocks.flatMap((item) => item.runs?.map((r) => r.text ?? '') ?? []),
        );
      }
      if (block.type === 'appendixEntry') {
        return [`Ek-${block.number} ${block.title} ${block.page}`];
      }
      if (block.type === 'bibliographyEntry') {
        const detail = (block.detailRuns ?? []).map((run) => run.text ?? '').join('');
        return [`${block.authorLabel}: ${detail}`];
      }
      return block.runs?.map((r) => r.text ?? '') ?? [];
    })
    .join('')
    .trimEnd();
}

function sectionHasContent(doc) {
  if (!doc || typeof doc !== 'object') return false;
  const serialized = JSON.stringify(doc);
  if (serialized.includes('"academicFootnote"')) return true;
  if (serialized.includes('"appendixEntry"')) return true;
  if (serialized.includes('"bibliographyEntry"')) return true;
  if (serialized.includes('"editorComment"')) return true;
  return tiptapJsonToPlainText(doc).trim().length > 0;
}

const SECTION_LEADING_HEADINGS = {
  kapak: ['kapak'],
  oz: ['öz', 'oz'],
  abstract: ['abstract'],
  onsoz: ['önsöz', 'onsof'],
  ekler: ['ekler', 'ekler listesi'],
  kisaltmalar: ['kısaltmalar', 'kısaltmalar listesi'],
  icindekiler: ['içindekiler', 'icindekiler'],
  body: ['ana metin'],
  kaynakca: ['kaynakça', 'kaynakca'],
};

function blocksToPlainText(runs) {
  return (runs ?? [])
    .filter((run) => run.type !== 'footnote')
    .map((run) => run.text ?? '')
    .join('')
    .trim();
}

function normalizeLabel(text) {
  return (text ?? '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isEmptyParagraphBlock(block) {
  return block?.type === 'paragraph' && !blocksToPlainText(block.runs);
}

function buildEklerSectionTitleBlock() {
  return {
    type: 'heading',
    level: 1,
    textAlign: 'center',
    forceSpaceBelow: true,
    runs: [{ text: 'EKLER', bold: true }],
  };
}

function isEklerSectionTitleBlock(block) {
  if (block?.type !== 'heading') return false;
  return EKLER_HEADING_LABELS.has(normalizeLabel(blocksToPlainText(block.runs)));
}

function normalizeEklerTitleBlock() {
  return buildEklerSectionTitleBlock();
}

function prepareEklerBlocks(blocks) {
  const titleIdx = blocks.findIndex(isEklerSectionTitleBlock);

  if (titleIdx === -1) {
    return [buildEklerSectionTitleBlock(), ...blocks];
  }

  const result = [...blocks];
  if (titleIdx > 0) {
    const [title] = result.splice(titleIdx, 1);
    result.unshift(normalizeEklerTitleBlock());
  } else {
    result[0] = normalizeEklerTitleBlock();
  }

  return result;
}

function shouldStripLeadingHeading(block, sectionKey, sectionLabel) {
  if (block?.type !== 'heading') return false;

  const headingNorm = normalizeLabel(blocksToPlainText(block.runs));
  const labels = new Set([
    normalizeLabel(sectionLabel),
    ...(SECTION_LEADING_HEADINGS[sectionKey] ?? []).map((value) => normalizeLabel(value)),
  ]);

  return labels.has(headingNorm);
}

function prepareSectionBlocks(sectionKey, sectionLabel, doc) {
  let blocks = parseDocBlocks(doc);

  if (blocks.length && sectionKey !== 'ekler' && shouldStripLeadingHeading(blocks[0], sectionKey, sectionLabel)) {
    blocks = blocks.slice(1);
  }

  while (blocks.length && isEmptyParagraphBlock(blocks[0])) {
    blocks = blocks.slice(1);
  }

  if (sectionKey === 'ekler') {
    blocks = prepareEklerBlocks(blocks);
  }

  const result = [];

  // Kapak / Ekler: içerik kendi başlığını taşır; üstüne ayrıca bölüm başlığı ekleme
  if (sectionKey !== 'kapak' && sectionKey !== 'ekler') {
    result.push({
      type: 'heading',
      level: 1,
      runs: [{ text: sectionLabel, bold: true }],
    });
  }

  result.push(...blocks);
  return result;
}

function buildMergedBlocks(sectionEntries) {
  const allBlocks = [];

  for (const { section, doc } of sectionEntries) {
    if (!doc) continue;

    const label = GOOGLE_DOC_SECTION_LABELS[section] ?? section;

    if (allBlocks.length > 0) {
      allBlocks.push({ type: 'pageBreak' });
    }

    allBlocks.push(...prepareSectionBlocks(section, label, doc));
  }

  return allBlocks;
}

function getBodyEndIndex(document) {
  const bodyContent = document.body?.content ?? [];
  if (!bodyContent.length) return 1;
  return bodyContent[bodyContent.length - 1].endIndex - 1;
}

async function clearDocumentBody(docs, googleDocsFileId) {
  const { data: document } = await docs.documents.get({ documentId: googleDocsFileId });
  const endIndex = getBodyEndIndex(document);

  if (endIndex <= 1) return;

  await docs.documents.batchUpdate({
    documentId: googleDocsFileId,
    requestBody: {
      requests: [{ deleteContentRange: { range: { startIndex: 1, endIndex } } }],
    },
  });
}

function chunkRequests(requests, size = BATCH_CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < requests.length; i += size) {
    chunks.push(requests.slice(i, i + size));
  }
  return chunks;
}

async function batchUpdateChunks(docs, googleDocsFileId, requests) {
  for (const chunk of chunkRequests(requests)) {
    if (!chunk.length) continue;
    await docs.documents.batchUpdate({
      documentId: googleDocsFileId,
      requestBody: { requests: chunk },
    });
  }
}

function getRecentInsertedText(builder, maxLen = 120) {
  for (let i = builder.insertRequests.length - 1; i >= 0; i -= 1) {
    const text = builder.insertRequests[i]?.insertText?.text;
    if (text) return text.slice(-maxLen);
  }
  return '';
}

class DocumentBuilder {
  constructor() {
    this.insertRequests = [];
    this.paragraphStyles = [];
    this.textStyles = [];
    this.footnoteCitations = [];
    this.commentAnchors = [];
    this.index = 1;
  }

  insertText(text) {
    if (!text) return;

    const last = this.insertRequests.at(-1);
    if (last?.insertText) {
      last.insertText.text += text;
    } else {
      this.insertRequests.push({
        insertText: { location: { index: this.index }, text },
      });
    }

    this.index += text.length;
  }

  insertPageBreak() {
    this.flushTextBuffer();
    this.insertRequests.push({
      insertPageBreak: { location: { index: this.index } },
    });
    this.index += 1;
  }

  flushTextBuffer() {
    // insertText already coalesces; page breaks and footnotes start a new chunk.
  }

  insertRuns(runs) {
    for (const run of runs ?? []) {
      if (run.type === 'footnote') {
        this.insertRequests.push({
          createFootnote: { location: { index: this.index } },
        });
        this.footnoteCitations.push(run.citation ?? '');
        this.index += 1;
        continue;
      }

      if (run.type === 'comment') {
        const anchorOffset = Math.max(0, this.index - 1);
        const quotedText = getRecentInsertedText(this).trim();
        this.commentAnchors.push({
          commentId: run.commentId,
          offset: anchorOffset,
          quotedText,
          commentText: run.commentText ?? '',
          userName: run.userName ?? '',
        });
        this.insertText('\u200b');
        continue;
      }

      if (!run.text) continue;

      const start = this.index;
      this.insertText(run.text);
      const end = this.index;

      if (run.bold || run.italic) {
        this.textStyles.push({ start, end, bold: run.bold, italic: run.italic });
      }
    }
  }

  finishParagraph({
    paragraphStart,
    namedStyleType = 'NORMAL_TEXT',
    blockquote = false,
    bullet = false,
    ordered = false,
    textAlign = null,
    spaceBelow = false,
    appendixEntry = false,
  }) {
    this.insertText('\n');
    this.paragraphStyles.push({
      start: paragraphStart,
      end: this.index,
      namedStyleType,
      blockquote,
      bullet,
      ordered,
      textAlign,
      spaceBelow,
      appendixEntry,
    });
  }

  finishAppendixEntry({ number, title, page }) {
    const paragraphStart = this.index;
    const label = `Ek-${number}`;
    const pageStr = String(page ?? '');
    const titleStr = title ?? '';
    const prefix = `${label} `;

    const labelStart = this.index;
    this.insertText(prefix);
    this.textStyles.push({ start: labelStart, end: labelStart + label.length, bold: true });

    this.insertText(titleStr);

    const dotCount = Math.max(
      3,
      APPENDIX_LINE_CHAR_TARGET - prefix.length - titleStr.length - pageStr.length,
    );
    if (pageStr) {
      this.insertText('.'.repeat(dotCount));
      const pageStart = this.index;
      this.insertText(pageStr);
      this.textStyles.push({ start: pageStart, end: this.index, bold: true });
    } else if (dotCount > 0) {
      this.insertText('.'.repeat(dotCount));
    }

    this.finishParagraph({
      paragraphStart,
      namedStyleType: 'NORMAL_TEXT',
      spaceBelow: true,
      appendixEntry: true,
    });
  }

  finishBibliographyEntry({ authorLabel, detailRuns }) {
    const paragraphStart = this.index;
    const authorText = `${authorLabel ?? ''}: `;
    this.insertText(authorText);

    for (const run of detailRuns ?? []) {
      const runStart = this.index;
      this.insertText(run.text ?? '');
      if (run.bold) {
        this.textStyles.push({ start: runStart, end: this.index, bold: true });
      }
    }

    this.finishParagraph({
      paragraphStart,
      namedStyleType: 'NORMAL_TEXT',
      spaceBelow: true,
    });
  }
}

function processBlock(block, builder) {
  if (block.type === 'pageBreak') {
    builder.insertPageBreak();
    return;
  }

  if (block.type === 'heading') {
    const paragraphStart = builder.index;
    builder.insertRuns(block.runs);
    builder.finishParagraph({
      paragraphStart,
      namedStyleType: HEADING_STYLE[block.level] ?? 'HEADING_1',
      textAlign: block.textAlign,
      spaceBelow: block.forceSpaceBelow || shouldAddSpaceBelow(block.textAlign),
    });
    return;
  }

  if (block.type === 'paragraph') {
    const paragraphStart = builder.index;
    builder.insertRuns(block.runs);
    builder.finishParagraph({
      paragraphStart,
      namedStyleType: 'NORMAL_TEXT',
      blockquote: block.blockquote,
      textAlign: block.textAlign,
      spaceBelow: shouldAddSpaceBelow(block.textAlign),
    });
    return;
  }

  if (block.type === 'list') {
    for (const itemBlocks of block.items) {
      for (const itemBlock of itemBlocks) {
        const paragraphStart = builder.index;
        builder.insertRuns(itemBlock.runs ?? []);
        builder.finishParagraph({
          paragraphStart,
          namedStyleType: 'NORMAL_TEXT',
          bullet: !block.ordered,
          ordered: block.ordered,
        });
      }
    }
    return;
  }

  if (block.type === 'appendixEntry') {
    builder.finishAppendixEntry({
      number: block.number,
      title: block.title,
      page: block.page,
    });
    return;
  }

  if (block.type === 'bibliographyEntry') {
    builder.finishBibliographyEntry({
      authorLabel: block.authorLabel,
      detailRuns: block.detailRuns,
    });
  }
}

function buildFormattingRequests(paragraphStyles, textStyles) {
  const requests = [];

  for (const style of paragraphStyles) {
    if (style.end <= style.start) continue;

    const needsNamedStyle = style.namedStyleType !== 'NORMAL_TEXT';
    const needsBlockquote = style.blockquote;
    const needsBullets = style.bullet || style.ordered;
    const needsAlignment = style.textAlign === 'center';

    const paragraphStyle = { lineSpacing: LINE_SPACING_ONE_AND_HALF };
    const fields = ['lineSpacing'];

    if (needsNamedStyle) {
      paragraphStyle.namedStyleType = style.namedStyleType;
      fields.push('namedStyleType');
    }

    if (needsBlockquote) {
      paragraphStyle.indentStart = { magnitude: 36, unit: 'PT' };
      paragraphStyle.indentEnd = { magnitude: 36, unit: 'PT' };
      fields.push('indentStart', 'indentEnd');
    }

    if (needsAlignment) {
      paragraphStyle.alignment = 'CENTER';
      fields.push('alignment');
    }

    if (style.spaceBelow) {
      paragraphStyle.spaceBelow = { magnitude: PARAGRAPH_SPACE_BELOW_PT, unit: 'PT' };
      fields.push('spaceBelow');
    }

    requests.push({
      updateParagraphStyle: {
        range: { startIndex: style.start, endIndex: style.end },
        paragraphStyle,
        fields: fields.join(','),
      },
    });

    if (needsBullets) {
      requests.push({
        createParagraphBullets: {
          range: { startIndex: style.start, endIndex: style.end },
          bulletPreset: style.ordered
            ? 'NUMBERED_DECIMAL_NESTED'
            : 'BULLET_DISC_CIRCLE_SQUARE',
        },
      });
    }

    requests.push({
      updateTextStyle: {
        range: { startIndex: style.start, endIndex: style.end },
        textStyle: buildThesisTextStyle(thesisFontSizePt(style.namedStyleType)),
        fields: THESIS_FONT_TEXT_STYLE_FIELDS,
      },
    });
  }

  for (const style of textStyles) {
    if (style.end <= style.start) continue;

    const textStyle = {};
    const fields = [];

    if (style.bold) {
      textStyle.bold = true;
      fields.push('bold');
    }
    if (style.italic) {
      textStyle.italic = true;
      fields.push('italic');
    }

    if (!fields.length) continue;

    requests.push({
      updateTextStyle: {
        range: { startIndex: style.start, endIndex: style.end },
        textStyle,
        fields: fields.join(','),
      },
    });
  }

  return requests;
}

function collectFootnoteRequests(replies, citations) {
  const requests = [];
  let footnoteIdx = 0;

  for (const reply of replies ?? []) {
    const footnoteId = reply.createFootnote?.footnoteId;
    if (!footnoteId) continue;

    const citation = citations[footnoteIdx];
    footnoteIdx += 1;

    if (citation) {
      requests.push({
        insertText: {
          location: { segmentId: footnoteId, index: 0 },
          text: citation,
        },
      });
      requests.push({
        updateTextStyle: {
          range: {
            segmentId: footnoteId,
            startIndex: 0,
            endIndex: citation.length,
          },
          textStyle: buildThesisTextStyle(THESIS_BODY_FONT_SIZE_PT),
          fields: THESIS_FONT_TEXT_STYLE_FIELDS,
        },
      });
    }
  }

  return requests;
}

async function applyThesisDocumentMargins(docs, googleDocsFileId) {
  await docs.documents.batchUpdate({
    documentId: googleDocsFileId,
    requestBody: {
      requests: [
        {
          updateDocumentStyle: {
            documentStyle: {
              pageSize: THESIS_PAGE_SIZE,
              marginTop: { magnitude: THESIS_MARGIN_PT, unit: 'PT' },
              marginBottom: { magnitude: THESIS_MARGIN_PT, unit: 'PT' },
              marginLeft: { magnitude: THESIS_MARGIN_PT, unit: 'PT' },
              marginRight: { magnitude: THESIS_MARGIN_PT, unit: 'PT' },
            },
            fields: 'pageSize,marginTop,marginBottom,marginLeft,marginRight',
          },
        },
      ],
    },
  });
}

async function applyBlocksToGoogleDoc(docs, googleDocsFileId, blocks) {
  await applyThesisDocumentMargins(docs, googleDocsFileId);
  await clearDocumentBody(docs, googleDocsFileId);

  const builder = new DocumentBuilder();
  for (const block of blocks) {
    processBlock(block, builder);
  }

  if (!builder.insertRequests.length) return [];

  let insertReplies = [];
  for (const chunk of chunkRequests(builder.insertRequests)) {
    const { data } = await docs.documents.batchUpdate({
      documentId: googleDocsFileId,
      requestBody: { requests: chunk },
    });
    insertReplies = insertReplies.concat(data.replies ?? []);
  }

  const footnoteRequests = collectFootnoteRequests(insertReplies, builder.footnoteCitations);
  if (footnoteRequests.length) {
    await batchUpdateChunks(docs, googleDocsFileId, footnoteRequests);
  }

  const formatRequests = buildFormattingRequests(builder.paragraphStyles, builder.textStyles);
  if (formatRequests.length) {
    await batchUpdateChunks(docs, googleDocsFileId, formatRequests);
  }

  return builder.commentAnchors;
}

function normalizeSectionEntries(sectionEntries) {
  if (!sectionEntries?.length) return [];
  if (sectionEntries[0]?.section && sectionEntries[0]?.doc) {
    return sectionEntries;
  }
  return sectionEntries.map((doc, i) => ({
    section: GOOGLE_DOC_SYNC_ORDER[i] ?? 'body',
    doc,
  }));
}

export function extractGoogleDocsError(err) {
  if (isInvalidGrantError(err)) {
    return 'GOOGLE_TOKEN_REVOKED';
  }

  if (isInsufficientScopeError(err)) {
    return 'GOOGLE_SCOPE_INSUFFICIENT';
  }

  for (let current = err; current; current = current.cause) {
    const apiMessage = current?.response?.data?.error?.message;
    if (apiMessage) return apiMessage;

    const apiStatus = current?.response?.data?.error?.status ?? '';
    if (/PERMISSION_DENIED|FAILED_PRECONDITION/i.test(apiStatus)) {
      const fallback = current?.message ?? apiStatus;
      if (fallback && !/^Request failed with status code \d+$/i.test(fallback)) {
        return fallback;
      }
    }
  }

  if (isGoogleNetworkError(err)) {
    return 'GOOGLE_NETWORK_ERROR';
  }

  return err?.message ?? 'UNKNOWN_GOOGLE_DOCS_ERROR';
}

/** Merge all project sections into one Google Doc (Kapak → … → Ana Metin). */
export async function syncProjectToGoogleDoc(
  userId,
  googleDocsFileId,
  sectionEntries,
  { client: sharedClient } = {},
) {
  const entries = normalizeSectionEntries(sectionEntries);
  const blocks = buildMergedBlocks(entries);

  if (!blocks.length) {
    throw new Error('NO_CONTENT_TO_SYNC');
  }

  const client = sharedClient ?? (await getDriveClientForUser(userId)).client;
  const docs = google.docs({ version: 'v1', auth: client });

  try {
    return await applyBlocksToGoogleDoc(docs, googleDocsFileId, blocks);
  } catch (err) {
    const message = extractGoogleDocsError(err);
    const wrapped = new Error(message);
    wrapped.cause = err;
    throw wrapped;
  }
}

async function deleteAllDriveComments(drive, fileId) {
  let pageToken;
  do {
    const { data } = await drive.comments.list({
      fileId,
      pageSize: 100,
      pageToken,
      fields: 'nextPageToken, comments(id)',
    });
    for (const comment of data.comments ?? []) {
      try {
        await drive.comments.delete({ fileId, commentId: comment.id });
      } catch (err) {
        const status = err?.response?.status ?? err?.code;
        if (status !== 404) throw err;
      }
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
}

function buildDriveCommentAnchor(revisionId, offset) {
  return JSON.stringify({
    r: revisionId,
    a: [{ txt: { o: offset, l: 1, ml: 1 } }],
  });
}

function formatDriveCommentContent(row) {
  const author = row.user_name ?? row.userName ?? 'Kullanıcı';
  const text = row.comment_text ?? row.commentText ?? '';
  if (row.is_resolved) {
    return `[Çözüldü] ${author}: ${text}`;
  }
  return `${author}: ${text}`;
}

/**
 * Create Google Drive comments anchored to editor comment positions after doc sync.
 * @param {Array<{ commentId: number|string|null, offset: number }>} commentAnchors
 * @param {Array<object>} dbComments rows from commentModel.findByProjectId
 * @param {(commentId: number, projectId: number, driveCommentId: string) => Promise<void>} [onDriveCommentCreated]
 */
export async function syncProjectCommentsToGoogleDrive(
  userId,
  googleDocsFileId,
  projectId,
  commentAnchors,
  dbComments,
  { drive: sharedDrive, onDriveCommentCreated } = {},
) {
  const drive = sharedDrive ?? (await getDriveClientForUser(userId)).drive;
  const commentMap = new Map(
    (dbComments ?? []).map((row) => [Number(row.id), row]),
  );

  await deleteAllDriveComments(drive, googleDocsFileId);

  if (!commentAnchors?.length) return { synced: 0 };

  const { data: fileMeta } = await drive.files.get({
    fileId: googleDocsFileId,
    fields: 'headRevisionId',
  });
  const revisionId = fileMeta.headRevisionId;
  if (!revisionId) return { synced: 0 };

  let synced = 0;
  const seen = new Set();

  for (const anchor of commentAnchors) {
    const commentId = Number(anchor.commentId);
    if (!Number.isFinite(commentId) || seen.has(commentId)) continue;

    const row = commentMap.get(commentId);
    if (!row) continue;

    seen.add(commentId);

    const requestBody = {
      content: formatDriveCommentContent(row),
      anchor: buildDriveCommentAnchor(revisionId, anchor.offset),
    };

    const quoted = (anchor.quotedText ?? '').trim();
    if (quoted) {
      requestBody.quotedFileContent = {
        mimeType: 'application/vnd.google-apps.document',
        value: quoted,
      };
    }

    const { data: created } = await drive.comments.create({
      fileId: googleDocsFileId,
      requestBody,
      fields: 'id',
    });

    if (created?.id && onDriveCommentCreated) {
      await onDriveCommentCreated(commentId, projectId, created.id);
    }
    synced += 1;
  }

  return { synced };
}

/** @deprecated Use syncProjectToGoogleDoc for full project export */
export async function syncTiptapToGoogleDoc(userId, googleDocsFileId, tiptapContent) {
  await syncProjectToGoogleDoc(userId, googleDocsFileId, [{ section: 'body', doc: tiptapContent }]);
}

export function projectHasSyncableContent(sectionEntries) {
  const entries = normalizeSectionEntries(sectionEntries);
  return entries.some(({ doc }) => sectionHasContent(doc));
}
