import { Node, mergeAttributes } from '@tiptap/core';

export function formatAppendixLabel(number) {
  return `Ek-${number}`;
}

function applyAppendixDomAttrs(dom, attrs) {
  dom.dataset.appendixEntry = 'true';
  dom.dataset.number = String(attrs.number ?? 1);
  dom.dataset.title = attrs.title ?? '';
  dom.dataset.page = String(attrs.page ?? '');
}

export const AppendixEntry = Node.create({
  name: 'appendixEntry',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      onDoubleClick: null,
    };
  },

  addAttributes() {
    return {
      number: { default: 1 },
      title: { default: '' },
      page: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-appendix-entry]',
        getAttrs: (element) => ({
          number: Number(element.getAttribute('data-number')) || 1,
          title: element.getAttribute('data-title') || '',
          page: element.getAttribute('data-page') || '',
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-appendix-entry': 'true',
        'data-number': node.attrs.number,
        'data-title': node.attrs.title,
        'data-page': node.attrs.page,
        class: 'appendix-entry',
      }),
      ['span', { class: 'appendix-label' }, formatAppendixLabel(node.attrs.number)],
      ['span', { class: 'appendix-title' }, node.attrs.title || '\u00a0'],
      ['span', { class: 'appendix-leader', 'aria-hidden': 'true' }],
      ['span', { class: 'appendix-page' }, String(node.attrs.page ?? '')],
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor, extension }) => {
      const dom = document.createElement('div');
      dom.className = 'appendix-entry';
      applyAppendixDomAttrs(dom, node.attrs);

      const label = document.createElement('span');
      label.className = 'appendix-label';

      const title = document.createElement('span');
      title.className = 'appendix-title';

      const leader = document.createElement('span');
      leader.className = 'appendix-leader';
      leader.setAttribute('aria-hidden', 'true');

      const page = document.createElement('span');
      page.className = 'appendix-page';

      const render = (attrs) => {
        label.textContent = formatAppendixLabel(attrs.number);
        title.textContent = attrs.title || '\u00a0';
        page.textContent = String(attrs.page ?? '');
      };

      render(node.attrs);

      dom.append(label, title, leader, page);

      const onDoubleClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const pos = getPos();
        if (typeof pos !== 'number') return;

        const currentNode = editor.state.doc.nodeAt(pos);
        if (!currentNode) return;

        extension.options.onDoubleClick?.({ pos, attrs: currentNode.attrs });
      };

      dom.addEventListener('dblclick', onDoubleClick);

      return {
        dom,
        ignoreMutation: () => true,
        update(updatedNode) {
          if (updatedNode.type.name !== 'appendixEntry') return false;
          applyAppendixDomAttrs(dom, updatedNode.attrs);
          render(updatedNode.attrs);
          return true;
        },
        destroy() {
          dom.removeEventListener('dblclick', onDoubleClick);
        },
      };
    };
  },
});

export default AppendixEntry;
