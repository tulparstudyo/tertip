const COVER_BY_ID = {
  'voice-writing': '/images/conveniences/voice-writing.png',
  'camera-footnote': '/images/conveniences/camera-footnote.png',
  'footnote-rules': '/images/conveniences/footnote-rules.png',
  'appendix-auto': '/images/conveniences/appendix-auto.png',
  'toc-auto': '/images/conveniences/toc-auto.png',
  'abstract-auto': '/images/conveniences/abstract-auto.png',
  'abstract-translate': '/images/conveniences/abstract-translate.png',
  'bibliography-auto': '/images/conveniences/bibliography-auto.png',
  'image-ocr': '/images/conveniences/image-ocr.png',
  'ottoman-transcript': '/images/conveniences/ottoman-transcript.png',
  'web-research': '/images/conveniences/web-research.png',
};

export function resolveConvenienceCover(item) {
  return item?.coverImage?.trim() || COVER_BY_ID[item?.id] || null;
}
