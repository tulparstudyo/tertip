export function formatAppendixInfoLabel(number, title) {
  const n = Number(number) || 1;
  const text = String(title ?? '').trim();
  return text ? `EK-${n}: ${text}` : `EK-${n}`;
}

/** Renumber appendixInfo blocks in document order (1..n). Returns whether attrs changed. */
export function renumberAppendixInfosInEditor(editor) {
  if (!editor) return false;

  const updates = [];
  let index = 0;

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== 'appendixInfo') return;
    index += 1;
    if (Number(node.attrs.number) !== index) {
      updates.push({ pos, number: index, attrs: node.attrs });
    }
  });

  if (updates.length === 0) return false;

  editor.chain().focus().command(({ tr }) => {
    updates
      .sort((a, b) => b.pos - a.pos)
      .forEach(({ pos, number, attrs }) => {
        tr.setNodeMarkup(pos, undefined, { ...attrs, number });
      });
    return true;
  }).run();

  return true;
}

export function getAppendixInfoInsertPos(state) {
  const { $from } = state.selection;
  return $from.after($from.depth);
}
