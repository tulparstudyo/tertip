import { Node, mergeAttributes } from '@tiptap/core';
import { TABLER_ICON_BOOKMARK, TABLER_ICON_PHOTO } from '@/utils/tabler-inline-icons.js';

const FOOTNOTE_ICON_SVG = TABLER_ICON_BOOKMARK;
const IMAGE_CITATION_ICON_SVG = TABLER_ICON_PHOTO;

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
