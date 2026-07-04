import { Node, mergeAttributes } from '@tiptap/core';

export function formatAppendixInfoLabel(number, title) {
  const n = Number(number) || 1;
  const text = String(title ?? '').trim();
  return text ? `EK-${n}: ${text}` : `EK-${n}`;
}

function applyAppendixInfoDomAttrs(dom, attrs) {
  dom.dataset.appendixInfo = 'true';
  dom.dataset.appendixInfoId = attrs.appendixInfoId ?? '';
  dom.dataset.number = String(attrs.number ?? 1);
  dom.dataset.title = attrs.title ?? '';
  dom.className = 'editor-appendix-info';
  dom.setAttribute('aria-label', formatAppendixInfoLabel(attrs.number, attrs.title));
}

export const AppendixInfo = Node.create({
  name: 'appendixInfo',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return {
      onSingleClick: null,
      onDoubleClick: null,
    };
  },

  addAttributes() {
    return {
      appendixInfoId: { default: '' },
      number: { default: 1 },
      title: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-appendix-info]',
        getAttrs: (element) => ({
          appendixInfoId: element.getAttribute('data-appendix-info-id') || '',
          number: Number(element.getAttribute('data-number')) || 1,
          title: element.getAttribute('data-title') || '',
        }),
      },
      {
        tag: 'span[data-appendix-info]',
        getAttrs: (element) => ({
          appendixInfoId: element.getAttribute('data-appendix-info-id') || '',
          number: Number(element.getAttribute('data-number')) || 1,
          title: element.getAttribute('data-title') || '',
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-appendix-info': 'true',
        'data-appendix-info-id': node.attrs.appendixInfoId ?? '',
        'data-number': node.attrs.number ?? 1,
        'data-title': node.attrs.title ?? '',
        class: 'editor-appendix-info',
        'aria-label': formatAppendixInfoLabel(node.attrs.number, node.attrs.title),
      }),
      formatAppendixInfoLabel(node.attrs.number, node.attrs.title),
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor, extension }) => {
      const dom = document.createElement('div');
      applyAppendixInfoDomAttrs(dom, node.attrs);
      dom.textContent = formatAppendixInfoLabel(node.attrs.number, node.attrs.title);

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
          if (updatedNode.type.name !== 'appendixInfo') return false;
          applyAppendixInfoDomAttrs(dom, updatedNode.attrs);
          dom.textContent = formatAppendixInfoLabel(updatedNode.attrs.number, updatedNode.attrs.title);
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

export default AppendixInfo;
