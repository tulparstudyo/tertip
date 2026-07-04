import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { ReplaceAroundStep, ReplaceStep } from '@tiptap/pm/transform';

export const ALLOW_PROTECTED_DELETE_META = 'allowProtectedNodeDelete';

export const PROTECTED_INLINE_NODE_NAMES = new Set(['academicFootnote', 'editorComment', 'appendixInfo']);

export const PROTECTED_NODE_NAMES = PROTECTED_INLINE_NODE_NAMES;

function selectionTargetsProtectedNode(state) {
  const { selection } = state;
  if (selection.node && PROTECTED_INLINE_NODE_NAMES.has(selection.node.type.name)) {
    return true;
  }
  if (selection.empty) {
    const { $from } = selection;
    const before = $from.nodeBefore;
    const after = $from.nodeAfter;
    return (
      (before && PROTECTED_INLINE_NODE_NAMES.has(before.type.name))
      || (after && PROTECTED_INLINE_NODE_NAMES.has(after.type.name))
    );
  }
  return false;
}

function transactionDeletesProtectedNode(tr) {
  if (!tr.docChanged) return false;

  for (const step of tr.steps) {
    if (!(step instanceof ReplaceStep || step instanceof ReplaceAroundStep)) continue;
    let blocked = false;
    tr.before.nodesBetween(step.from, step.to, (node) => {
      if (PROTECTED_INLINE_NODE_NAMES.has(node.type.name)) blocked = true;
    });
    if (blocked) return true;
  }
  return false;
}

/** Delete a protected inline node (use instead of deleteSelection for footnotes/comments). */
export function deleteProtectedNodeAt(editor, pos) {
  if (!editor) return false;
  const node = editor.state.doc.nodeAt(pos);
  if (!node || !PROTECTED_INLINE_NODE_NAMES.has(node.type.name)) return false;

  const tr = editor.state.tr;
  tr.setMeta(ALLOW_PROTECTED_DELETE_META, true);
  tr.delete(pos, pos + node.nodeSize);
  editor.view.dispatch(tr);
  return true;
}

export const ProtectedInlineNodes = Extension.create({
  name: 'protectedInlineNodes',

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => selectionTargetsProtectedNode(editor.state),
      Delete: ({ editor }) => selectionTargetsProtectedNode(editor.state),
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        filterTransaction(tr) {
          if (tr.getMeta(ALLOW_PROTECTED_DELETE_META)) return true;
          if (!tr.docChanged) return true;
          return !transactionDeletesProtectedNode(tr);
        },
      }),
    ];
  },
});

export default ProtectedInlineNodes;
