function extractNodeText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text ?? '';
  return (node.content ?? []).map(extractNodeText).join('');
}

function normalizeLabel(text) {
  return (text ?? '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const SECTION_LEADING_HEADINGS = {
  oz: ['öz', 'oz'],
  abstract: ['abstract'],
  onsoz: ['önsöz', 'onsoz'],
  ekler: ['ekler', 'ekler listesi'],
  kisaltmalar: ['kısaltmalar', 'kısaltmalar listesi'],
  icindekiler: ['içindekiler', 'icindekiler'],
  body: ['ana metin'],
  sonuc: ['sonuç', 'sonuc'],
  kaynakca: ['kaynakça', 'kaynakca'],
};

/** Google Docs birleştirmede eklenmeyen bölüm başlıkları. */
const SKIP_SYNTHETIC_SECTION_LABEL = new Set(['kapak', 'ekler', 'body']);

function shouldStripLeadingHeading(text, sectionKey, sectionLabel) {
  const headingNorm = normalizeLabel(text);
  const labels = new Set([
    normalizeLabel(sectionLabel),
    ...(SECTION_LEADING_HEADINGS[sectionKey] ?? []).map((value) => normalizeLabel(value)),
  ]);
  return labels.has(headingNorm);
}

function isEmptyParagraph(node) {
  return node?.type === 'paragraph' && !extractNodeText(node).trim();
}

function applyMarks(text, marks = []) {
  let el = document.createTextNode(text);
  for (const mark of marks) {
    if (mark.type === 'bold') {
      const strong = document.createElement('strong');
      strong.appendChild(el);
      el = strong;
    } else if (mark.type === 'italic') {
      const em = document.createElement('em');
      em.appendChild(el);
      el = em;
    }
  }
  return el;
}

function collectFootnotesFromContent(content) {
  const footnotes = [];
  for (const node of content ?? []) {
    if (node.type === 'academicFootnote') {
      footnotes.push(node);
    }
  }
  return footnotes;
}

function renderInlineContent(content, target) {
  for (const node of content ?? []) {
    if (node.type === 'text') {
      target.appendChild(applyMarks(node.text ?? '', node.marks));
      continue;
    }
    if (node.type === 'hardBreak') {
      target.appendChild(document.createElement('br'));
      continue;
    }
    if (node.type === 'academicFootnote') {
      const sup = document.createElement('sup');
      sup.textContent = '¹';
      sup.className = 'measure-footnote-ref';
      target.appendChild(sup);
      continue;
    }
    if (node.type === 'editorComment') {
      continue;
    }
  }
}

function renderParagraphBlock(node, ctx) {
  const footnotes = collectFootnotesFromContent(node.content);
  const hasFootnotes = footnotes.length > 0;

  if (!hasFootnotes) {
    const el = document.createElement('p');
    renderInlineContent(node.content, el);
    if (node.attrs?.textAlign === 'center') {
      el.style.textAlign = 'center';
    }
    return el;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'measure-paragraph-block';

  const el = document.createElement('p');
  renderInlineContent(node.content, el);
  if (node.attrs?.textAlign === 'center') {
    el.style.textAlign = 'center';
  }
  wrapper.appendChild(el);

  for (const fn of footnotes) {
    const block = document.createElement('div');
    block.className = 'measure-footnote-block';
    block.textContent = fn.attrs?.formattedText?.trim() || `s. ${fn.attrs?.pageNumber ?? '?'}`;
    wrapper.appendChild(block);
  }

  return wrapper;
}

function renderBlock(node, ctx) {
  if (!node) return null;

  if (node.type === 'heading') {
    const level = Number(node.attrs?.level) || 1;
    const el = document.createElement(`h${Math.min(6, Math.max(1, level))}`);
    renderInlineContent(node.content, el);
    if (level >= 1 && level <= 3) {
      const idx = ctx.headingIndexRef.value;
      ctx.headingIndexRef.value += 1;
      el.dataset.tocSection = ctx.section;
      el.dataset.tocHeadingIndex = String(idx);
      el.dataset.tocLevel = String(level);
    }
    if (node.attrs?.textAlign === 'center') {
      el.style.textAlign = 'center';
    }
    return el;
  }

  if (node.type === 'paragraph') {
    return renderParagraphBlock(node, ctx);
  }

  if (node.type === 'blockquote') {
    const el = document.createElement('blockquote');
    for (const child of node.content ?? []) {
      const childEl = renderBlock(child, ctx);
      if (childEl) el.appendChild(childEl);
    }
    return el;
  }

  if (node.type === 'bulletList' || node.type === 'orderedList') {
    const el = document.createElement(node.type === 'orderedList' ? 'ol' : 'ul');
    for (const item of node.content ?? []) {
      const li = document.createElement('li');
      for (const child of item.content ?? []) {
        const childEl = renderBlock(child, ctx);
        if (childEl) li.appendChild(childEl);
      }
      el.appendChild(li);
    }
    return el;
  }

  if (node.type === 'table') {
    const table = document.createElement('table');
    for (const row of node.content ?? []) {
      const tr = document.createElement('tr');
      for (const cell of row.content ?? []) {
        const td = document.createElement('td');
        for (const child of cell.content ?? []) {
          const childEl = renderBlock(child, ctx);
          if (childEl) td.appendChild(childEl);
        }
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    return table;
  }

  if (node.type === 'appendixEntry') {
    const el = document.createElement('div');
    el.className = 'measure-appendix-entry';
    el.textContent = `Ek-${node.attrs?.number ?? 1} ${node.attrs?.title ?? ''}`;
    return el;
  }

  if (node.type === 'bibliographyEntry') {
    const el = document.createElement('div');
    el.className = 'measure-bibliography-entry';
    const author = node.attrs?.authorLabel ?? '';
    const detail = (node.attrs?.detailRuns ?? []).map((r) => r.text ?? '').join('');
    el.textContent = `${author}: ${detail}`;
    return el;
  }

  if (node.type === 'appendixInfo') {
    const el = document.createElement('div');
    el.className = 'measure-appendix-info';
    el.textContent = `EK-${node.attrs?.number ?? 1}: ${node.attrs?.title ?? ''}`;
    return el;
  }

  if (node.type === 'tocEntry') {
    const el = document.createElement('div');
    el.className = 'measure-toc-entry';
    const { variant, number, title, chapterLabel } = node.attrs ?? {};
    if (variant === 'chapter') {
      const label = document.createElement('div');
      label.className = 'measure-toc-chapter-label';
      label.textContent = chapterLabel ?? '';
      const titleEl = document.createElement('div');
      titleEl.className = 'measure-toc-chapter-title';
      titleEl.textContent = title ?? '';
      el.append(label, titleEl);
    } else {
      el.textContent = `${number ?? ''} ${title ?? ''}`.trim();
    }
    return el;
  }

  if (node.type === 'sectionBreak') {
    const el = document.createElement('div');
    el.className = 'measure-section-break editor-section-break';
    el.dataset.sectionBreak = 'true';
    el.setAttribute('aria-hidden', 'true');
    const line = document.createElement('span');
    line.className = 'editor-section-break__line';
    const label = document.createElement('span');
    label.className = 'editor-section-break__label';
    label.textContent = 'Yeni bölüm';
    el.append(line, label);
    return el;
  }

  return null;
}

function padToNextPage(offsetPx, pageHeightPx) {
  const remainder = offsetPx % pageHeightPx;
  if (remainder === 0) return 0;
  return pageHeightPx - remainder;
}

function createMeasurePageSpacer(heightPx) {
  const spacer = document.createElement('div');
  spacer.className = 'thesis-measure-page-spacer';
  spacer.style.height = `${heightPx}px`;
  spacer.setAttribute('aria-hidden', 'true');
  return spacer;
}

/** Bölüm içeriğini Google Docs birleştirme ile aynı sırayla hazırlar (sentetik başlık strip vb.). */
export function prepareSectionNodes(sectionKey, sectionLabel, doc) {
  let nodes = [...(doc?.content ?? [])];

  if (nodes.length && sectionKey !== 'ekler' && sectionKey !== 'kapak') {
    const first = nodes[0];
    if (first?.type === 'heading') {
      const text = extractNodeText(first);
      if (shouldStripLeadingHeading(text, sectionKey, sectionLabel)) {
        nodes = nodes.slice(1);
      }
    }
  }

  while (nodes.length && isEmptyParagraph(nodes[0])) {
    nodes = nodes.slice(1);
  }

  return nodes;
}

function appendMeasureBlock(target, el) {
  if (el) target.appendChild(el);
}

/**
 * @param {object} [measureCtx] — verilirse DOM'a yazar (sayfa ölçümü); yoksa element dizisi döner.
 */
export function prepareSectionContent(sectionKey, sectionLabel, doc, measureCtx = null) {
  const nodes = prepareSectionNodes(sectionKey, sectionLabel, doc);
  const blocks = [];
  const target = measureCtx?.container ?? null;
  const pageHeightPx = measureCtx?.pageHeightPx ?? 0;
  const measureRoot = measureCtx?.root ?? null;

  if (!SKIP_SYNTHETIC_SECTION_LABEL.has(sectionKey)) {
    const h1 = document.createElement('h1');
    h1.textContent = sectionLabel;
    h1.dataset.sectionStart = sectionKey;
    if (target) appendMeasureBlock(target, h1);
    else blocks.push(h1);
  } else {
    const marker = document.createElement('div');
    marker.dataset.sectionStart = sectionKey;
    marker.style.height = '0';
    marker.style.overflow = 'hidden';
    if (target) appendMeasureBlock(target, marker);
    else blocks.push(marker);
  }

  const headingIndexRef = { value: 0 };
  const ctx = { section: sectionKey, headingIndexRef };

  for (const node of nodes) {
    if (node.type === 'sectionBreak' && measureRoot && pageHeightPx > 0 && target) {
      const pad = padToNextPage(measureRoot.scrollHeight, pageHeightPx);
      if (pad > 0) appendMeasureBlock(target, createMeasurePageSpacer(pad));
    }

    const el = renderBlock(node, ctx);
    if (target) appendMeasureBlock(target, el);
    else if (el) blocks.push(el);
  }

  return { blocks, headingCount: headingIndexRef.value };
}

export function injectThesisMeasureStyles(doc) {
  if (doc.getElementById('thesis-measure-styles')) return;

  const style = doc.createElement('style');
  style.id = 'thesis-measure-styles';
  style.textContent = `
    .thesis-measure-root {
      width: 160mm;
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
    }
    .thesis-measure-page-spacer {
      width: 100%;
      margin: 0;
      padding: 0;
      border: 0;
    }
    .thesis-measure-root h1,
    .thesis-measure-root h2,
    .thesis-measure-root h3,
    .thesis-measure-root h4,
    .thesis-measure-root h5,
    .thesis-measure-root h6 {
      font-size: 14pt;
      font-weight: 700;
      margin: 0 0 12pt;
      line-height: 1.5;
    }
    .thesis-measure-root p {
      margin: 0 0 12pt;
      text-align: justify;
    }
    .thesis-measure-root blockquote {
      margin: 0 0 12pt 36pt;
      padding-right: 36pt;
    }
    .thesis-measure-root ul,
    .thesis-measure-root ol {
      margin: 0 0 12pt 1.25rem;
      padding: 0;
    }
    .thesis-measure-root li {
      margin-bottom: 6pt;
    }
    .thesis-measure-root table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12pt;
    }
    .thesis-measure-root td {
      vertical-align: top;
      padding: 0 2mm 2mm 0;
      font-size: 12pt;
    }
    .thesis-measure-root .measure-paragraph-block {
      margin-bottom: 12pt;
    }
    .thesis-measure-root .measure-paragraph-block p {
      margin-bottom: 0;
    }
    .thesis-measure-root .measure-footnote-block {
      font-size: 10pt;
      line-height: 1.4;
      margin: 4pt 0 0 18pt;
      text-indent: -18pt;
    }
    .thesis-measure-root .measure-appendix-entry,
    .thesis-measure-root .measure-bibliography-entry,
    .thesis-measure-root .measure-appendix-info,
    .thesis-measure-root .measure-toc-entry {
      margin: 0 0 8pt;
    }
    .thesis-measure-root .measure-toc-chapter-label,
    .thesis-measure-root .measure-toc-chapter-title {
      text-align: center;
      font-weight: 700;
      font-size: 12pt;
      margin: 0 0 4pt;
    }
    .thesis-measure-root .measure-section-break {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 12pt 0;
    }
    .thesis-measure-root .measure-section-break .editor-section-break__line {
      flex: 1;
      border-top: 1px solid #64748b;
      height: 0;
    }
    .thesis-measure-root .measure-section-break .editor-section-break__label {
      font-size: 9pt;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }
    .thesis-measure-section {
      width: 100%;
    }
  `;
  doc.head.appendChild(style);
}
