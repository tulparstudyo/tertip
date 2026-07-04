/** Map a ProseMirror document position to 1-based line/column (block-separated). */
export function getEditorLineColumn(doc, pos) {
  const safePos = Math.max(0, Math.min(pos, doc.content.size));
  const textBefore = doc.textBetween(0, safePos, '\n', '\n');
  const lines = textBefore.split('\n');
  return {
    lineNumber: lines.length,
    columnOffset: lines[lines.length - 1]?.length ?? 0,
  };
}

export function getDocumentLineCount(doc) {
  if (!doc || doc.content.size === 0) return 1;
  const text = doc.textBetween(0, doc.content.size, '\n', '\n');
  return Math.max(1, text.split('\n').length);
}

/** Map 1-based line/column back to a document position (inverse of getEditorLineColumn). */
export function getPosFromLineColumn(doc, lineNumber, columnOffset) {
  const targetLine = Math.max(1, Number(lineNumber) || 1);
  const targetCol = Math.max(0, Number(columnOffset) || 0);
  const maxPos = doc.content.size;

  for (let pos = 0; pos <= maxPos; pos += 1) {
    const lc = getEditorLineColumn(doc, pos);
    if (lc.lineNumber === targetLine && lc.columnOffset === targetCol) {
      return pos;
    }
  }

  let fallbackPos = 0;
  for (let pos = 0; pos <= maxPos; pos += 1) {
    const lc = getEditorLineColumn(doc, pos);
    if (lc.lineNumber < targetLine) {
      fallbackPos = pos;
    } else if (lc.lineNumber === targetLine) {
      if (lc.columnOffset <= targetCol) fallbackPos = pos;
      else break;
    } else {
      break;
    }
  }

  return fallbackPos;
}

/** Visible 1-based line range in the editor viewport (page scroll). */
export function getVisibleEditorLineRange(editor, { padding = 2 } = {}) {
  if (!editor?.view?.dom) {
    return { fromLine: 1, toLine: 1 };
  }

  const view = editor.view;
  const dom = view.dom;
  const rect = dom.getBoundingClientRect();
  const doc = editor.state.doc;
  const total = getDocumentLineCount(doc);

  if (rect.bottom <= 0) {
    return { fromLine: 1, toLine: Math.min(total, padding * 2 + 1) };
  }

  if (rect.top >= window.innerHeight) {
    return { fromLine: Math.max(1, total - padding * 2), toLine: total };
  }

  const visibleTop = Math.max(rect.top, 0);
  const visibleBottom = Math.min(rect.bottom, window.innerHeight);
  const sampleX = rect.left + Math.min(48, Math.max(8, rect.width / 3));

  const topHit = view.posAtCoords({ left: sampleX, top: visibleTop + 4 });
  const bottomHit = view.posAtCoords({ left: sampleX, top: visibleBottom - 4 });

  const fromLine = getEditorLineColumn(doc, topHit?.pos ?? 0).lineNumber;
  const toLine = getEditorLineColumn(doc, bottomHit?.pos ?? doc.content.size).lineNumber;

  return {
    fromLine: Math.max(1, Math.min(fromLine, toLine) - padding),
    toLine: Math.min(total, Math.max(fromLine, toLine) + padding),
  };
}
