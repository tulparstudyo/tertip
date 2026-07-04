import {
  THESIS_CONTENT_HEIGHT_MM,
  THESIS_PAGINATION_SECTION_ORDER,
  THESIS_SECTION_LABELS,
  mmToPx,
} from './thesis-layout.js';
import { injectThesisMeasureStyles, prepareSectionContent } from './tiptap-measure-renderer.js';

function pageIndexFromOffset(offsetPx, pageHeightPx) {
  return Math.floor(Math.max(0, offsetPx) / pageHeightPx) + 1;
}

function padToNextPage(offsetPx, pageHeightPx) {
  const remainder = offsetPx % pageHeightPx;
  if (remainder === 0) return 0;
  return pageHeightPx - remainder;
}

function createPageBreakSpacer(heightPx) {
  const spacer = document.createElement('div');
  spacer.className = 'thesis-measure-page-spacer';
  spacer.style.height = `${heightPx}px`;
  spacer.setAttribute('aria-hidden', 'true');
  return spacer;
}

export function measureThesisPageMap(sectionDocs) {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;left:-99999px;top:0;visibility:hidden;pointer-events:none;z-index:-1;';
  document.body.appendChild(host);

  injectThesisMeasureStyles(document);

  const root = document.createElement('div');
  root.className = 'thesis-measure-root';
  host.appendChild(root);

  const pageHeightPx = mmToPx(THESIS_CONTENT_HEIGHT_MM);
  const sectionPages = {};
  const headingPages = {};
  let bodyStartPage = 1;

  const rootTop = () => root.getBoundingClientRect().top;

  function insertPageBreakBeforeSection() {
    const pad = padToNextPage(root.scrollHeight, pageHeightPx);
    if (pad > 0) {
      root.appendChild(createPageBreakSpacer(pad));
    }
  }

  try {
    const sections = THESIS_PAGINATION_SECTION_ORDER.filter(
      (slug) => sectionDocs[slug] && sectionDocs[slug]?.content?.length,
    );

    for (let i = 0; i < sections.length; i += 1) {
      const slug = sections[i];
      if (i > 0) {
        insertPageBreakBeforeSection();
      }

      const label = THESIS_SECTION_LABELS[slug] ?? slug;
      const sectionEl = document.createElement('div');
      sectionEl.className = 'thesis-measure-section';
      sectionEl.dataset.section = slug;
      root.appendChild(sectionEl);

      prepareSectionContent(slug, label, sectionDocs[slug], {
        root,
        container: sectionEl,
        pageHeightPx,
      });

      const sectionTop = sectionEl.getBoundingClientRect().top - rootTop();
      const sectionStartPage = pageIndexFromOffset(sectionTop, pageHeightPx);
      sectionPages[slug] = sectionStartPage;

      if (slug === 'body') {
        bodyStartPage = sectionStartPage;
      }

      const headings = sectionEl.querySelectorAll('[data-toc-section][data-toc-heading-index]');
      for (const headingEl of headings) {
        const sectionKey = headingEl.dataset.tocSection;
        const index = headingEl.dataset.tocHeadingIndex;
        const top = headingEl.getBoundingClientRect().top - rootTop();
        headingPages[`${sectionKey}:${index}`] = pageIndexFromOffset(top, pageHeightPx);
      }
    }

    const endPad = padToNextPage(root.scrollHeight, pageHeightPx);
    const eklerEndOffset = root.scrollHeight + (endPad > 0 ? endPad : pageHeightPx);
    sectionPages.ekler_end = pageIndexFromOffset(eklerEndOffset, pageHeightPx);

    return {
      bodyStartPage,
      sectionPages,
      headingPages,
    };
  } finally {
    document.body.removeChild(host);
  }
}

/** Proje bölümlerini API'den çekip sayfa haritası oluşturur. */
export async function fetchAndMeasureProjectPages(projectId, api) {
  const sectionDocs = {};

  await Promise.all(
    THESIS_PAGINATION_SECTION_ORDER.map(async (slug) => {
      if (slug === 'icindekiler') return;
      try {
        const res = await api(`/user/projects/${projectId}/sections/${slug}`, { silent: true });
        sectionDocs[slug] = res.data?.content ?? { type: 'doc', content: [] };
      } catch {
        sectionDocs[slug] = { type: 'doc', content: [] };
      }
    }),
  );

  sectionDocs.icindekiler = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2, textAlign: 'center' },
        content: [{ type: 'text', text: 'İÇİNDEKİLER', marks: [{ type: 'bold' }] }],
      },
      { type: 'paragraph', content: [{ type: 'text', text: '\u00a0' }] },
    ],
  };

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  return measureThesisPageMap(sectionDocs);
}
