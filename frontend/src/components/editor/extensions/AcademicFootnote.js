import { Node, mergeAttributes } from '@tiptap/core';

const FOOTNOTE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.969 7.969 0 0014.5 4c-1.669 0-3.218.51-4.5 1.385z"/></svg>`;

const IMAGE_CITATION_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm1 2a1 1 0 100 2h1a1 1 0 100-2H5zm3.707 5.707a1 1 0 00-1.414-1.414L5 12.586V11a1 1 0 10-2 0v3a1 1 0 001 1h3a1 1 0 100-2H6.414l2.293-2.293zM15 7a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd"/></svg>`;

function citationLabel(attrs) {
  if (attrs.isImageCitation) {
    return attrs.formattedText || `[Görsel] s. ${attrs.pageNumber ?? '?'}`;
  }
  return attrs.formattedText || `s. ${attrs.pageNumber ?? '?'}`;
}

function applyFootnoteDomAttrs(dom, attrs) {
  dom.dataset.academicFootnote = 'true';
  dom.dataset.isCustom = attrs.isCustom ? 'true' : 'false';
  dom.dataset.isImageCitation = attrs.isImageCitation ? 'true' : 'false';
  dom.dataset.imageCitationId = attrs.imageCitationId ?? '';
  dom.dataset.ocrText = attrs.ocrText ?? '';
  dom.dataset.sourceId = attrs.sourceId ?? '';
  dom.dataset.pageNumber = attrs.pageNumber ?? '';
  dom.dataset.citationType = attrs.citationType ?? 'book';
  dom.dataset.formattedText = attrs.formattedText ?? '';
  dom.setAttribute('aria-label', citationLabel(attrs));
}

export const AcademicFootnote = Node.create({
  name: 'academicFootnote',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addOptions() {
    return {
      onDoubleClick: null,
      onSingleClick: null,
    };
  },

  addAttributes() {
    return {
      isCustom: { default: false },
      isImageCitation: { default: false },
      imageCitationId: { default: null },
      ocrText: { default: '' },
      sourceId: { default: null },
      pageNumber: { default: null },
      citationType: { default: 'book' },
      formattedText: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-academic-footnote]',
        getAttrs: (element) => ({
          isCustom: element.getAttribute('data-is-custom') === 'true',
          isImageCitation: element.getAttribute('data-is-image-citation') === 'true',
          imageCitationId: element.getAttribute('data-image-citation-id')
            ? Number(element.getAttribute('data-image-citation-id'))
            : null,
          ocrText: element.getAttribute('data-ocr-text') || '',
          sourceId: element.getAttribute('data-source-id')
            ? Number(element.getAttribute('data-source-id'))
            : null,
          pageNumber: element.getAttribute('data-page-number')
            ? Number(element.getAttribute('data-page-number'))
            : null,
          citationType: element.getAttribute('data-citation-type') || 'book',
          formattedText: element.getAttribute('data-formatted-text') || '',
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-academic-footnote': 'true',
        'data-is-custom': node.attrs.isCustom ? 'true' : 'false',
        'data-is-image-citation': node.attrs.isImageCitation ? 'true' : 'false',
        'data-image-citation-id': node.attrs.imageCitationId ?? '',
        'data-ocr-text': node.attrs.ocrText ?? '',
        'data-source-id': node.attrs.sourceId ?? '',
        'data-page-number': node.attrs.pageNumber ?? '',
        'data-citation-type': node.attrs.citationType,
        'data-formatted-text': node.attrs.formattedText,
        class: 'academic-footnote',
        'aria-label': citationLabel(node.attrs),
      }),
      ['span', { class: 'academic-footnote-icon' }],
      ['span', { class: 'academic-footnote-tooltip' }, citationLabel(node.attrs)],
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor, extension }) => {
      const dom = document.createElement('span');
      dom.className = 'academic-footnote';
      if (node.attrs.isImageCitation) dom.classList.add('academic-footnote--image');
      applyFootnoteDomAttrs(dom, node.attrs);

      const icon = document.createElement('span');
      icon.className = 'academic-footnote-icon';
      icon.innerHTML = node.attrs.isImageCitation ? IMAGE_CITATION_ICON_SVG : FOOTNOTE_ICON_SVG;

      const tooltip = document.createElement('span');
      tooltip.className = 'academic-footnote-tooltip';
      tooltip.textContent = citationLabel(node.attrs);

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
          if (updatedNode.type.name !== 'academicFootnote') return false;
          dom.classList.toggle('academic-footnote--image', updatedNode.attrs.isImageCitation);
          applyFootnoteDomAttrs(dom, updatedNode.attrs);
          icon.innerHTML = updatedNode.attrs.isImageCitation
            ? IMAGE_CITATION_ICON_SVG
            : FOOTNOTE_ICON_SVG;
          tooltip.textContent = citationLabel(updatedNode.attrs);
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

export default AcademicFootnote;
