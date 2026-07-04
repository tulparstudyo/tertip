import { Node, mergeAttributes } from '@tiptap/core';

function applyTocDomAttrs(dom, attrs) {
  dom.dataset.tocEntry = 'true';
  dom.dataset.variant = attrs.variant ?? 'item';
  dom.dataset.chapterLabel = attrs.chapterLabel ?? '';
  dom.dataset.number = attrs.number ?? '';
  dom.dataset.title = attrs.title ?? '';
  dom.dataset.page = String(attrs.page ?? '');
  dom.dataset.level = String(attrs.level ?? 1);
}

export const TocEntry = Node.create({
  name: 'tocEntry',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return {
      onDoubleClick: null,
    };
  },

  addAttributes() {
    return {
      variant: { default: 'item' },
      chapterLabel: { default: '' },
      number: { default: '' },
      title: { default: '' },
      page: { default: '' },
      level: { default: 1 },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-toc-entry]',
        getAttrs: (element) => ({
          variant: element.getAttribute('data-variant') || 'item',
          chapterLabel: element.getAttribute('data-chapter-label') || '',
          number: element.getAttribute('data-number') || '',
          title: element.getAttribute('data-title') || '',
          page: element.getAttribute('data-page') || '',
          level: Number(element.getAttribute('data-level')) || 1,
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { variant } = node.attrs;

    if (variant === 'chapter') {
      return [
        'div',
        mergeAttributes(HTMLAttributes, {
          'data-toc-entry': 'true',
          'data-variant': 'chapter',
          'data-chapter-label': node.attrs.chapterLabel,
          'data-title': node.attrs.title,
          class: 'toc-entry toc-entry--chapter',
        }),
        ['div', { class: 'toc-chapter-label' }, node.attrs.chapterLabel || '\u00a0'],
        ['div', { class: 'toc-chapter-title' }, node.attrs.title || '\u00a0'],
      ];
    }

    const prefix = variant === 'intro'
      ? ''
      : `${node.attrs.number} `;

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-toc-entry': 'true',
        'data-variant': variant,
        'data-number': node.attrs.number,
        'data-title': node.attrs.title,
        'data-page': node.attrs.page,
        'data-level': node.attrs.level,
        class: [
          'toc-entry',
          'toc-entry--item',
          variant === 'intro' ? 'toc-entry--intro' : '',
          `toc-entry--level-${node.attrs.level}`,
        ].filter(Boolean).join(' '),
      }),
      [
        'span',
        { class: 'toc-heading-text' },
        ['span', { class: 'toc-label' }, prefix],
        [
          'span',
          { class: 'toc-title' },
          variant === 'intro' ? node.attrs.title : node.attrs.title || '\u00a0',
        ],
      ],
      ['span', { class: 'toc-leader', 'aria-hidden': 'true' }],
      ['span', { class: 'toc-page' }, String(node.attrs.page ?? '')],
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor, extension }) => {
      const dom = document.createElement('div');
      applyTocDomAttrs(dom, node.attrs);

      const render = (attrs) => {
        dom.replaceChildren();

        if (attrs.variant === 'chapter') {
          dom.className = 'toc-entry toc-entry--chapter';
          const label = document.createElement('div');
          label.className = 'toc-chapter-label';
          label.textContent = attrs.chapterLabel || '\u00a0';
          const title = document.createElement('div');
          title.className = 'toc-chapter-title';
          title.textContent = attrs.title || '\u00a0';
          dom.append(label, title);
          return;
        }

        dom.className = [
          'toc-entry',
          'toc-entry--item',
          attrs.variant === 'intro' ? 'toc-entry--intro' : '',
          `toc-entry--level-${attrs.level}`,
        ].filter(Boolean).join(' ');

        const headingText = document.createElement('span');
        headingText.className = 'toc-heading-text';

        const label = document.createElement('span');
        label.className = 'toc-label';
        label.textContent = attrs.variant === 'intro' ? '' : `${attrs.number} `;

        const title = document.createElement('span');
        title.className = 'toc-title';
        title.textContent = attrs.title || '\u00a0';

        headingText.append(label, title);

        const leader = document.createElement('span');
        leader.className = 'toc-leader';
        leader.setAttribute('aria-hidden', 'true');

        const page = document.createElement('span');
        page.className = 'toc-page';
        page.textContent = String(attrs.page ?? '');

        dom.append(headingText, leader, page);
      };

      render(node.attrs);

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
          if (updatedNode.type.name !== 'tocEntry') return false;
          applyTocDomAttrs(dom, updatedNode.attrs);
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

export default TocEntry;
