import {
  IconMicrophone,
  IconCamera,
  IconBookmark,
  IconFiles,
  IconListNumbers,
  IconArticle,
  IconLanguage,
  IconBooks,
  IconPhotoScan,
  IconOld,
  IconWorldSearch,
  IconFileText,
} from '@tabler/icons-vue';

export const CONVENIENCE_ICON_MAP = {
  microphone: IconMicrophone,
  camera: IconCamera,
  bookmark: IconBookmark,
  files: IconFiles,
  'list-numbers': IconListNumbers,
  article: IconArticle,
  language: IconLanguage,
  books: IconBooks,
  'photo-scan': IconPhotoScan,
  old: IconOld,
  'world-search': IconWorldSearch,
};

export const CONVENIENCE_ICON_BY_ID = {
  'voice-writing': 'microphone',
  'camera-footnote': 'camera',
  'footnote-rules': 'bookmark',
  'appendix-auto': 'files',
  'toc-auto': 'list-numbers',
  'abstract-auto': 'article',
  'abstract-translate': 'language',
  'bibliography-auto': 'books',
  'image-ocr': 'photo-scan',
  'ottoman-transcript': 'old',
  'web-research': 'world-search',
};

export const CONVENIENCE_COLOR_BY_ID = {
  'voice-writing': 'text-violet-600',
  'camera-footnote': 'text-rose-600',
  'footnote-rules': 'text-amber-600',
  'appendix-auto': 'text-sky-600',
  'toc-auto': 'text-teal-600',
  'abstract-auto': 'text-indigo-600',
  'abstract-translate': 'text-blue-600',
  'bibliography-auto': 'text-emerald-600',
  'image-ocr': 'text-orange-600',
  'ottoman-transcript': 'text-stone-600',
  'web-research': 'text-cyan-600',
};

export function resolveConvenienceIcon(item) {
  const key = item?.icon || CONVENIENCE_ICON_BY_ID[item?.id];
  return CONVENIENCE_ICON_MAP[key] ?? IconFileText;
}

export function convenienceIconColor(item, selected, variant = 'desktop') {
  if (selected) {
    return variant === 'mobile' ? 'text-indigo-700' : 'text-white';
  }
  return CONVENIENCE_COLOR_BY_ID[item?.id] ?? 'text-indigo-600';
}
