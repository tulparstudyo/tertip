import { Node, mergeAttributes } from '@tiptap/core';
import { TABLER_ICON_MESSAGE } from '@/utils/tabler-inline-icons.js';

function commentPreview(text, max = 80) {
  const trimmed = (text ?? '').trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

function commentTooltip(attrs) {
  const parts = [];
  if (attrs.userName) parts.push(attrs.userName);
  if (attrs.createdAt) {
    parts.push(new Date(attrs.createdAt).toLocaleString('tr-TR'));
  }
  const meta = parts.join(' · ');
  const text = commentPreview(attrs.commentText);
  return meta && text ? `${meta}\n${text}` : text || meta || 'Yorum';
}

function applyCommentDomAttrs(dom, attrs) {
  dom.dataset.editorComment = 'true';
  dom.dataset.commentId = attrs.commentId ?? '';
  dom.dataset.tiptapCommentId = attrs.tiptapCommentId ?? '';
  dom.dataset.commentText = attrs.commentText ?? '';
  dom.dataset.userName = attrs.userName ?? '';
  dom.dataset.createdAt = attrs.createdAt ?? '';
  dom.dataset.lineNumber = attrs.lineNumber ?? '';
  dom.dataset.columnOffset = attrs.columnOffset ?? '';
  dom.dataset.isResolved = attrs.isResolved ? 'true' : 'false';
  dom.className = attrs.isResolved
    ? 'editor-comment editor-comment--resolved'
    : 'editor-comment';
  dom.setAttribute('aria-label', commentTooltip(attrs));
}

export const EditorComment = Node.create({
  name: 'editorComment',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addOptions() {
    return {
      onSingleClick: null,
      onDoubleClick: null,
    };
  },

  addAttributes() {
    return {
      commentId: { default: null },
      tiptapCommentId: { default: '' },
      commentText: { default: '' },
      userName: { default: '' },
      createdAt: { default: '' },
      lineNumber: { default: null },
      columnOffset: { default: null },
      isResolved: { default: false },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-editor-comment]',
        getAttrs: (element) => ({
          commentId: element.getAttribute('data-comment-id')
            ? Number(element.getAttribute('data-comment-id'))
            : null,
          tiptapCommentId: element.getAttribute('data-tiptap-comment-id') || '',
          commentText: element.getAttribute('data-comment-text') || '',
          userName: element.getAttribute('data-user-name') || '',
          createdAt: element.getAttribute('data-created-at') || '',
          lineNumber: element.getAttribute('data-line-number')
            ? Number(element.getAttribute('data-line-number'))
            : null,
          columnOffset: element.getAttribute('data-column-offset')
            ? Number(element.getAttribute('data-column-offset'))
            : null,
          isResolved: element.getAttribute('data-is-resolved') === 'true',
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-editor-comment': 'true',
        'data-comment-id': node.attrs.commentId ?? '',
        'data-tiptap-comment-id': node.attrs.tiptapCommentId,
        'data-comment-text': node.attrs.commentText,
        'data-user-name': node.attrs.userName,
        'data-created-at': node.attrs.createdAt,
        'data-line-number': node.attrs.lineNumber ?? '',
        'data-column-offset': node.attrs.columnOffset ?? '',
        'data-is-resolved': node.attrs.isResolved ? 'true' : 'false',
        class: node.attrs.isResolved
          ? 'editor-comment editor-comment--resolved'
          : 'editor-comment',
        'aria-label': commentTooltip(node.attrs),
      }),
      ['span', { class: 'editor-comment-icon' }],
      ['span', { class: 'editor-comment-tooltip' }, commentTooltip(node.attrs)],
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor, extension }) => {
      const dom = document.createElement('span');
      applyCommentDomAttrs(dom, node.attrs);

      const icon = document.createElement('span');
      icon.className = 'editor-comment-icon';
      icon.innerHTML = TABLER_ICON_MESSAGE;

      const tooltip = document.createElement('span');
      tooltip.className = 'editor-comment-tooltip';
      tooltip.textContent = commentTooltip(node.attrs);

      dom.appendChild(icon);
      dom.appendChild(tooltip);

      const onClick = (event) => {
        if (event.detail !== 1) return;
        event.preventDefault();
        event.stopPropagation();
        extension.options.onSingleClick?.(dom);
      };

      const onDoubleClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const pos = getPos();
        if (typeof pos !== 'number') return;
        const currentNode = editor.state.doc.nodeAt(pos);
        if (!currentNode) return;
        extension.options.onDoubleClick?.({ pos, attrs: currentNode.attrs });
      };

      dom.addEventListener('click', onClick);
      dom.addEventListener('dblclick', onDoubleClick);

      return {
        dom,
        ignoreMutation: () => true,
        update(updatedNode) {
          if (updatedNode.type.name !== 'editorComment') return false;
          applyCommentDomAttrs(dom, updatedNode.attrs);
          tooltip.textContent = commentTooltip(updatedNode.attrs);
          return true;
        },
        destroy() {
          dom.removeEventListener('click', onClick);
          dom.removeEventListener('dblclick', onDoubleClick);
        },
      };
    };
  },
});

export default EditorComment;
