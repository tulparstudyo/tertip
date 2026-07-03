import { Node, mergeAttributes } from '@tiptap/core';

function applyBibliographyDomAttrs(dom, attrs) {
  dom.dataset.bibliographyEntry = 'true';
  dom.dataset.sourceId = attrs.sourceId != null ? String(attrs.sourceId) : '';
  dom.dataset.authorLabel = attrs.authorLabel ?? '';
  dom.dataset.detailRuns = JSON.stringify(attrs.detailRuns ?? []);
}

function renderDetailRuns(container, detailRuns) {
  container.replaceChildren();
  for (const run of detailRuns ?? []) {
    const span = document.createElement('span');
    span.textContent = run.text ?? '';
    if (run.bold) span.classList.add('bibliography-bold');
    container.appendChild(span);
  }
}

export const BibliographyEntry = Node.create({
  name: 'bibliographyEntry',
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
      sourceId: { default: null },
      authorLabel: { default: '' },
      sortKey: { default: '' },
      detailRuns: { default: [] },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-bibliography-entry]',
        getAttrs: (element) => {
          let detailRuns = [];
          try {
            detailRuns = JSON.parse(element.getAttribute('data-detail-runs') || '[]');
          } catch {
            detailRuns = [];
          }
          return {
            sourceId: element.getAttribute('data-source-id')
              ? Number(element.getAttribute('data-source-id'))
              : null,
            authorLabel: element.getAttribute('data-author-label') || '',
            detailRuns,
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-bibliography-entry': 'true',
        'data-source-id': node.attrs.sourceId ?? '',
        'data-author-label': node.attrs.authorLabel ?? '',
        'data-detail-runs': JSON.stringify(node.attrs.detailRuns ?? []),
        class: 'bibliography-entry',
      }),
      ['span', { class: 'bibliography-author' }, `${node.attrs.authorLabel}:`],
      [
        'span',
        { class: 'bibliography-detail' },
        ...(node.attrs.detailRuns ?? []).map((run) => [
          'span',
          run.bold ? { class: 'bibliography-bold' } : {},
          run.text ?? '',
        ]),
      ],
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor, extension }) => {
      const dom = document.createElement('div');
      dom.className = 'bibliography-entry';
      applyBibliographyDomAttrs(dom, node.attrs);

      const author = document.createElement('span');
      author.className = 'bibliography-author';

      const detail = document.createElement('span');
      detail.className = 'bibliography-detail';

      const render = (attrs) => {
        author.textContent = `${attrs.authorLabel}:`;
        renderDetailRuns(detail, attrs.detailRuns);
      };

      render(node.attrs);
      dom.append(author, detail);

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
          if (updatedNode.type.name !== 'bibliographyEntry') return false;
          applyBibliographyDomAttrs(dom, updatedNode.attrs);
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

export default BibliographyEntry;
