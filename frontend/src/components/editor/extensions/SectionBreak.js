import { Node, mergeAttributes } from '@tiptap/core';

export const SectionBreak = Node.create({
  name: 'sectionBreak',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return {
      label: 'Yeni bölüm',
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-section-break]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-section-break': 'true',
        class: 'editor-section-break',
        contenteditable: 'false',
      }),
      ['span', { class: 'editor-section-break__line', 'aria-hidden': 'true' }],
      ['span', { class: 'editor-section-break__label' }],
    ];
  },

  addNodeView() {
    return ({ extension }) => {
      const dom = document.createElement('div');
      dom.dataset.sectionBreak = 'true';
      dom.className = 'editor-section-break';
      dom.contentEditable = 'false';

      const line = document.createElement('span');
      line.className = 'editor-section-break__line';
      line.setAttribute('aria-hidden', 'true');

      const label = document.createElement('span');
      label.className = 'editor-section-break__label';
      label.textContent = extension.options.label ?? 'Yeni bölüm';

      dom.append(line, label);

      return {
        dom,
        ignoreMutation: () => true,
      };
    };
  },

  addCommands() {
    return {
      insertSectionBreak:
        () =>
        ({ chain }) =>
          chain()
            .insertContent({ type: this.name })
            .run(),
    };
  },
});

export default SectionBreak;
