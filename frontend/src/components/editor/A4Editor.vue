<script setup>
import { ref, watch, onBeforeUnmount, computed } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { useI18n } from 'vue-i18n';
import { api } from '@/api/client';
import { toast } from '@/composables/useToast';
import AcademicFootnote from './extensions/AcademicFootnote.js';
import AppendixEntry from './extensions/AppendixEntry.js';
import BibliographyEntry from './extensions/BibliographyEntry.js';
import TextAlign from './extensions/TextAlign.js';
import { buildAuthorsDisplay } from '@/utils/author-citation.js';
import {
  formatTurkishFootnoteFull,
  buildFootnoteCitationUpdates,
  isExcludedFromFootnoteCheck,
} from '@/utils/turkish-footnote.js';
import {
  formatTurkishBibliographyEntry,
} from '@/utils/turkish-bibliography.js';
import ImageCitationModal from './ImageCitationModal.vue';
import { getEditorSectionConfig } from '@/config/project-sections.js';

const props = defineProps({
  projectId: { type: Number, default: null },
  title: { type: String, default: '' },
  projectType: { type: String, default: 'article' },
  section: { type: String, default: 'body' },
  sectionLabel: { type: String, default: '' },
  initialContent: { type: Object, default: null },
  canEdit: { type: Boolean, default: true },
});

const { t } = useI18n();
const toolbarConfig = computed(() => getEditorSectionConfig(props.section));
const displayTitle = computed(() => props.sectionLabel || props.title || t('editor.title'));

const sources = ref([]);
const sourceSearchQuery = ref('');
const sourcesLoading = ref(false);
let sourceSearchTimer = null;
const showFootnoteModal = ref(false);
const editingFootnotePos = ref(null);
const footnoteForm = ref({
  isCustom: false,
  sourceId: '',
  pageNumber: '',
  formattedText: '',
});
const checkFootnotesLoading = ref(false);
const showImageCitationModal = ref(false);
const imageCitationFile = ref(null);
const editingImageFootnotePos = ref(null);
const editingCitationImageId = ref(null);
const imageCitationInitialSourceId = ref('');
const imageCitationInitialOcr = ref('');
const imageCitationInitialPageNumber = ref(null);
const imageCitationInitialCitationText = ref('');
const imageCitationInput = ref(null);
const aiLoading = ref(false);
const showAiRewriteModal = ref(false);
const aiRewriteState = ref({
  from: 0,
  to: 0,
  originalText: '',
  revisedText: '',
  changes: [],
});
const driveSyncLoading = ref(false);
const generateKapakLoading = ref(false);
const generateOzLoading = ref(false);
const generateAbstractLoading = ref(false);
const generateKaynakcaLoading = ref(false);
const showAppendixModal = ref(false);
const editingAppendixPos = ref(null);
const appendixForm = ref({ number: 1, title: '', page: '' });
const showBibliographyModal = ref(false);
const editingBibliographyPos = ref(null);
const bibliographyForm = ref({ sourceId: '' });

const showGenerateKapak = computed(
  () => props.section === 'kapak' && props.projectType === 'thesis' && props.canEdit,
);

const showGenerateOz = computed(
  () => Boolean(toolbarConfig.value.generateOz) && props.canEdit,
);

const showGenerateAbstract = computed(
  () => Boolean(toolbarConfig.value.generateAbstract) && props.canEdit,
);

const showGenerateKaynakca = computed(
  () => Boolean(toolbarConfig.value.generateKaynakca) && props.canEdit,
);

const showCheckFootnotes = computed(
  () => Boolean(toolbarConfig.value.checkFootnotes) && props.canEdit,
);

const showImageCitations = computed(
  () => Boolean(toolbarConfig.value.imageCitations) && props.canEdit && props.projectId,
);

const isEklerSection = computed(() => props.section === 'ekler');
const isKaynakcaSection = computed(() => props.section === 'kaynakca');

let debounceTimer = null;
let skipSave = true;
let saveCycleActive = false;

function defaultHeading(level, text) {
  return {
    type: 'heading',
    attrs: { level },
    content: text ? [{ type: 'text', text }] : [],
  };
}

function centeredEklerTitle() {
  return {
    type: 'heading',
    attrs: { level: 1, textAlign: 'center' },
    content: [
      {
        type: 'text',
        text: 'EKLER',
        marks: [{ type: 'bold' }],
      },
    ],
  };
}

function centeredKaynakcaTitle() {
  return {
    type: 'heading',
    attrs: { level: 1, textAlign: 'center' },
    content: [
      {
        type: 'text',
        text: 'KAYNAKÇA',
        marks: [{ type: 'bold' }],
      },
    ],
  };
}

function buildDefaultContent() {
  if (props.initialContent) return props.initialContent;

  const sectionDefaults = {
    kapak: {
      type: 'doc',
      content: [defaultHeading(1, props.title), { type: 'paragraph' }],
    },
    oz: {
      type: 'doc',
      content: [defaultHeading(2, t('editor.sections.oz')), { type: 'paragraph' }],
    },
    abstract: {
      type: 'doc',
      content: [defaultHeading(2, t('editor.sections.abstract')), { type: 'paragraph' }],
    },
    onsoz: {
      type: 'doc',
      content: [defaultHeading(1, t('editor.sections.onsoz')), { type: 'paragraph' }],
    },
    ekler: {
      type: 'doc',
      content: [centeredEklerTitle()],
    },
    kaynakca: {
      type: 'doc',
      content: [centeredKaynakcaTitle()],
    },
    kisaltmalar: {
      type: 'doc',
      content: [defaultHeading(2, t('editor.sections.kisaltmalar')), { type: 'paragraph' }],
    },
    icindekiler: {
      type: 'doc',
      content: [defaultHeading(2, t('editor.sections.icindekiler')), { type: 'paragraph' }],
    },
    body: {
      type: 'doc',
      content: [defaultHeading(1, props.title), { type: 'paragraph' }],
    },
  };

  return sectionDefaults[props.section] ?? sectionDefaults.body;
}

async function saveContent(json, { silent = true } = {}) {
  if (!props.projectId || !props.canEdit) return null;

  try {
    const res = await api(`/user/projects/${props.projectId}/sections/${props.section}`, {
      method: 'PUT',
      body: { content: json },
      silent,
    });
    saveCycleActive = false;

    if (silent) {
      toast.success(res.message ?? t('editor.syncSaved'));
    }

    return res;
  } catch {
    saveCycleActive = false;
    if (silent) {
      toast.error(t('editor.saveError'));
    }
    return null;
  }
}

async function flushPendingSave() {
  clearTimeout(debounceTimer);
  if (!props.projectId || !props.canEdit || !editor.value) return null;
  return saveContent(editor.value.getJSON(), { silent: true });
}

async function syncToGoogleDrive() {
  if (!props.projectId || !props.canEdit) return;

  driveSyncLoading.value = true;
  try {
    await flushPendingSave();
    await api(`/user/projects/${props.projectId}/sync-google-doc`, { method: 'POST' });
  } catch {
    // Error toast is already shown by api().
  } finally {
    driveSyncLoading.value = false;
  }
}

async function generateKapak() {
  if (!props.projectId || !showGenerateKapak.value) return;

  generateKapakLoading.value = true;
  try {
    const res = await api(`/user/projects/${props.projectId}/generate-kapak`, {
      method: 'POST',
    });
    skipSave = true;
    editor.value?.commands.setContent(res.data?.content ?? { type: 'doc', content: [] });
    skipSave = false;
    saveCycleActive = false;
  } finally {
    generateKapakLoading.value = false;
  }
}

async function generateOz() {
  if (!props.projectId || !showGenerateOz.value) return;

  generateOzLoading.value = true;
  try {
    const res = await api(`/user/projects/${props.projectId}/generate-oz`, {
      method: 'POST',
    });
    skipSave = true;
    editor.value?.commands.setContent(res.data?.content ?? buildDefaultContent());
    skipSave = false;
    saveCycleActive = false;
  } catch {
    // Error toast is already shown by api().
  } finally {
    generateOzLoading.value = false;
  }
}

async function generateAbstract() {
  if (!props.projectId || !showGenerateAbstract.value) return;

  generateAbstractLoading.value = true;
  try {
    const res = await api(`/user/projects/${props.projectId}/generate-abstract`, {
      method: 'POST',
    });
    skipSave = true;
    editor.value?.commands.setContent(res.data?.content ?? buildDefaultContent());
    skipSave = false;
    saveCycleActive = false;
  } catch {
    // Error toast is already shown by api().
  } finally {
    generateAbstractLoading.value = false;
  }
}

async function generateKaynakca() {
  if (!props.projectId || !showGenerateKaynakca.value) return;

  generateKaynakcaLoading.value = true;
  try {
    const res = await api(`/user/projects/${props.projectId}/generate-kaynakca`, {
      method: 'POST',
    });
    skipSave = true;
    editor.value?.commands.setContent(res.data?.content ?? buildDefaultContent());
    skipSave = false;
    saveCycleActive = false;
  } catch {
    // Error toast is already shown by api().
  } finally {
    generateKaynakcaLoading.value = false;
  }
}

function buildEditorExtensions() {
  const extensions = [
    StarterKit,
    AcademicFootnote.configure({
      onSingleClick(dom) {
        clearFootnotePreviews();
        dom.classList.add('is-preview');
      },
      onDoubleClick({ pos, attrs }) {
        if (!props.canEdit) return;
        clearFootnotePreviews();
        openFootnoteEditModal(pos, attrs);
      },
    }),
    AppendixEntry.configure({
      onDoubleClick({ pos, attrs }) {
        if (!props.canEdit) return;
        openAppendixEditModal(pos, attrs);
      },
    }),
  ];

  if (props.section === 'kaynakca') {
    extensions.push(
      BibliographyEntry.configure({
        onDoubleClick({ pos, attrs }) {
          if (!props.canEdit) return;
          openBibliographyEditModal(pos, attrs);
        },
      }),
    );
  }

  if (props.section === 'kapak' || props.section === 'ekler' || props.section === 'kaynakca') {
    extensions.push(TextAlign);
  }

  return extensions;
}

function getNextAppendixNumber() {
  if (!editor.value) return 1;
  let max = 0;
  editor.value.state.doc.descendants((node) => {
    if (node.type.name === 'appendixEntry') {
      max = Math.max(max, Number(node.attrs.number) || 0);
    }
  });
  return max + 1;
}

function openAppendixEditModal(pos, attrs) {
  editingAppendixPos.value = pos;
  appendixForm.value = {
    number: attrs.number ?? 1,
    title: attrs.title ?? '',
    page: attrs.page ?? '',
  };
  showAppendixModal.value = true;
}

function openAppendixModal() {
  if (editor.value?.isActive('appendixEntry')) {
    const { from } = editor.value.state.selection;
    const node = editor.value.state.doc.nodeAt(from);
    if (node?.type.name === 'appendixEntry') {
      openAppendixEditModal(from, node.attrs);
      return;
    }
  }
  editingAppendixPos.value = null;
  appendixForm.value = {
    number: getNextAppendixNumber(),
    title: '',
    page: '',
  };
  showAppendixModal.value = true;
}

function closeAppendixModal() {
  editingAppendixPos.value = null;
  showAppendixModal.value = false;
}

function saveAppendixEntry() {
  if (!appendixForm.value.title.trim() || !String(appendixForm.value.page).trim()) return;

  const attrs = {
    number: Number(appendixForm.value.number) || 1,
    title: appendixForm.value.title.trim(),
    page: String(appendixForm.value.page).trim(),
  };

  if (editingAppendixPos.value !== null) {
    editor.value
      ?.chain()
      .focus()
      .setNodeSelection(editingAppendixPos.value)
      .updateAttributes('appendixEntry', attrs)
      .run();
  } else {
    editor.value
      ?.chain()
      .focus()
      .insertContent({ type: 'appendixEntry', attrs })
      .run();
  }

  closeAppendixModal();
}

function deleteAppendixEntry() {
  if (editingAppendixPos.value === null) return;
  editor.value
    ?.chain()
    .focus()
    .setNodeSelection(editingAppendixPos.value)
    .deleteSelection()
    .run();
  closeAppendixModal();
}

const appendixModalTitle = computed(() =>
  editingAppendixPos.value !== null ? t('editor.editAppendix') : t('editor.addAppendix'),
);

function isSourceAlreadyInBibliography(sourceId, excludePos = null) {
  if (!editor.value || sourceId == null) return false;
  let found = false;
  editor.value.state.doc.descendants((node, pos) => {
    if (found) return false;
    if (node.type.name !== 'bibliographyEntry') return;
    if (excludePos !== null && pos === excludePos) return;
    if (Number(node.attrs.sourceId) === Number(sourceId)) found = true;
  });
  return found;
}

function openBibliographyEditModal(pos, attrs) {
  editingBibliographyPos.value = pos;
  bibliographyForm.value = {
    sourceId: attrs.sourceId != null ? String(attrs.sourceId) : '',
  };
  showBibliographyModal.value = true;
  resetSourceSearch();
  if (attrs.sourceId) void ensureSourceInList(attrs.sourceId);
}

function openBibliographyModal() {
  if (editor.value?.isActive('bibliographyEntry')) {
    const { from } = editor.value.state.selection;
    const node = editor.value.state.doc.nodeAt(from);
    if (node?.type.name === 'bibliographyEntry') {
      openBibliographyEditModal(from, node.attrs);
      return;
    }
  }
  editingBibliographyPos.value = null;
  bibliographyForm.value = { sourceId: '' };
  showBibliographyModal.value = true;
  resetSourceSearch();
}

function closeBibliographyModal() {
  editingBibliographyPos.value = null;
  showBibliographyModal.value = false;
}

function resortBibliographyEntries() {
  const ed = editor.value;
  if (!ed) return;

  const json = ed.getJSON();
  const content = json.content ?? [];
  const prefix = [];
  const entries = [];

  for (const block of content) {
    if (block.type === 'bibliographyEntry') {
      entries.push(block);
    } else if (!entries.length) {
      prefix.push(block);
    }
  }

  entries.sort((a, b) => {
    const ak = a.attrs?.sortKey ?? a.attrs?.authorLabel ?? '';
    const bk = b.attrs?.sortKey ?? b.attrs?.authorLabel ?? '';
    return ak.localeCompare(bk, 'tr-TR');
  });

  skipSave = true;
  ed.commands.setContent({ type: 'doc', content: [...prefix, ...entries] });
  skipSave = false;
  saveCycleActive = false;
  void saveContent(ed.getJSON(), { silent: true });
}

function saveBibliographyEntry() {
  const source = sources.value.find((s) => s.id === Number(bibliographyForm.value.sourceId));
  if (!source) return;

  const entry = formatTurkishBibliographyEntry(source);
  const attrs = {
    sourceId: entry.sourceId,
    authorLabel: entry.authorLabel,
    sortKey: entry.sortKey,
    detailRuns: entry.detailRuns,
  };

  if (
    editingBibliographyPos.value === null &&
    isSourceAlreadyInBibliography(attrs.sourceId)
  ) {
    toast.error(t('editor.bibliographyDuplicate'));
    return;
  }

  if (editingBibliographyPos.value !== null) {
    editor.value
      ?.chain()
      .focus()
      .setNodeSelection(editingBibliographyPos.value)
      .updateAttributes('bibliographyEntry', attrs)
      .run();
  } else {
    editor.value
      ?.chain()
      .focus()
      .insertContent({ type: 'bibliographyEntry', attrs })
      .run();
  }

  closeBibliographyModal();
  resortBibliographyEntries();
}

function deleteBibliographyEntry() {
  if (editingBibliographyPos.value === null) return;
  editor.value
    ?.chain()
    .focus()
    .setNodeSelection(editingBibliographyPos.value)
    .deleteSelection()
    .run();
  closeBibliographyModal();
  resortBibliographyEntries();
}

const bibliographyModalTitle = computed(() =>
  editingBibliographyPos.value !== null
    ? t('editor.editBibliography')
    : t('editor.addBibliography'),
);

function clearFootnotePreviews() {
  document.querySelectorAll('.ProseMirror .academic-footnote.is-preview').forEach((el) => {
    el.classList.remove('is-preview');
  });
}

function openFootnoteEditModal(pos, attrs) {
  if (attrs.isImageCitation) {
    openImageCitationEditModal(pos, attrs);
    return;
  }
  editingFootnotePos.value = pos;
  footnoteForm.value = {
    isCustom: Boolean(attrs.isCustom),
    sourceId: attrs.sourceId ?? '',
    pageNumber: attrs.pageNumber ?? '',
    formattedText: attrs.formattedText ?? '',
  };
  showFootnoteModal.value = true;
  resetSourceSearch();
  if (attrs.sourceId) void ensureSourceInList(attrs.sourceId);
}

function openFootnoteModal() {
  if (editor.value?.isActive('academicFootnote')) {
    const { from } = editor.value.state.selection;
    const node = editor.value.state.doc.nodeAt(from);
    if (node?.type.name === 'academicFootnote') {
      if (node.attrs.isImageCitation) {
        openImageCitationEditModal(from, node.attrs);
      } else {
        openFootnoteEditModal(from, node.attrs);
      }
      return;
    }
  }
  editingFootnotePos.value = null;
  footnoteForm.value = {
    isCustom: false,
    sourceId: '',
    pageNumber: '',
    formattedText: '',
  };
  showFootnoteModal.value = true;
  resetSourceSearch();
}

const footnoteModalTitle = computed(() =>
  editingFootnotePos.value !== null ? t('editor.editFootnote') : t('editor.addFootnote'),
);

const footnoteSaveDisabled = computed(() => {
  if (footnoteForm.value.isCustom) {
    return !footnoteForm.value.formattedText.trim();
  }
  return !footnoteForm.value.sourceId || !footnoteForm.value.pageNumber;
});

const footnoteCitationPlaceholder = computed(() =>
  footnoteForm.value.isCustom
    ? t('editor.citationCustomRequired')
    : t('editor.citationOptional'),
);

const editor = useEditor({
  extensions: buildEditorExtensions(),
  content: buildDefaultContent(),
  editable: props.canEdit,
  editorProps: {
    attributes: {
      'data-placeholder': t('editor.placeholder'),
    },
    handleClickOn(_view, _pos, node) {
      if (node.type.name !== 'academicFootnote') {
        clearFootnotePreviews();
      }
      return false;
    },
  },
  onUpdate: ({ editor: ed }) => {
    if (skipSave || !props.projectId || !props.canEdit) return;

    if (!saveCycleActive) {
      toast.info(t('editor.syncPending'));
      saveCycleActive = true;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => saveContent(ed.getJSON()), 3000);
  },
});

const selectedText = computed(() => {
  if (!editor.value) return '';
  const { from, to } = editor.value.state.selection;
  return editor.value.state.doc.textBetween(from, to, ' ');
});

function runCommand(fn) {
  fn()?.run();
}

function toggleHeading(level) {
  runCommand(() => editor.value?.chain().focus().toggleHeading({ level }));
}

function toggleQuote() {
  runCommand(() => editor.value?.chain().focus().toggleItalic());
}

async function loadSources({ q = '', ids = [] } = {}) {
  sourcesLoading.value = true;
  try {
    if (ids.length) {
      const res = await api('/user/library/sources', {
        query: { ids: ids.join(',') },
        silent: true,
      });
      sources.value = res.data?.items ?? [];
      return;
    }

    const res = await api('/user/library/sources', {
      query: { q, limit: 50, page: 1 },
      silent: true,
    });
    sources.value = res.data?.items ?? [];
  } catch {
    sources.value = [];
  } finally {
    sourcesLoading.value = false;
  }
}

async function ensureSourceInList(sourceId) {
  if (!sourceId || sources.value.some((s) => s.id === Number(sourceId))) return;
  try {
    const res = await api(`/user/library/sources/${sourceId}`, { silent: true });
    if (res.data) sources.value = [res.data, ...sources.value];
  } catch {
    // Source may have been deleted.
  }
}

function searchSourcesDebounced() {
  clearTimeout(sourceSearchTimer);
  sourceSearchTimer = setTimeout(() => {
    void loadSources({ q: sourceSearchQuery.value.trim() });
  }, 300);
}

function resetSourceSearch() {
  sourceSearchQuery.value = '';
  void loadSources();
}

function openImageCitationPicker() {
  imageCitationInput.value?.click();
}

function onImageFileSelected(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;

  imageCitationFile.value = file;
  editingImageFootnotePos.value = null;
  editingCitationImageId.value = null;
  imageCitationInitialSourceId.value = '';
  imageCitationInitialOcr.value = '';
  imageCitationInitialPageNumber.value = null;
  imageCitationInitialCitationText.value = '';
  showImageCitationModal.value = true;
}

function openImageCitationEditModal(pos, attrs) {
  editingImageFootnotePos.value = pos;
  editingCitationImageId.value = attrs.imageCitationId ?? null;
  imageCitationFile.value = null;
  imageCitationInitialSourceId.value = attrs.sourceId ? String(attrs.sourceId) : '';
  imageCitationInitialOcr.value = attrs.ocrText ?? '';
  imageCitationInitialPageNumber.value = attrs.pageNumber ?? null;
  imageCitationInitialCitationText.value = attrs.formattedText ?? '';
  showImageCitationModal.value = true;
}

function closeImageCitationModal() {
  showImageCitationModal.value = false;
  imageCitationFile.value = null;
  editingImageFootnotePos.value = null;
  editingCitationImageId.value = null;
  imageCitationInitialSourceId.value = '';
  imageCitationInitialOcr.value = '';
  imageCitationInitialPageNumber.value = null;
  imageCitationInitialCitationText.value = '';
}

function onImageCitationSaved(attrs) {
  if (editingImageFootnotePos.value !== null) {
    editor.value
      ?.chain()
      .focus()
      .setNodeSelection(editingImageFootnotePos.value)
      .updateAttributes('academicFootnote', attrs)
      .run();
  } else {
    editor.value
      ?.chain()
      .focus()
      .insertContent({ type: 'academicFootnote', attrs })
      .run();
  }
  closeImageCitationModal();
}

function formatSourceOptionLabel(source) {
  const author = buildAuthorsDisplay(source);
  if (author) return `${source.title} (${author})`;
  return source.title;
}

function buildFootnoteAttrs() {
  if (footnoteForm.value.isCustom) {
    return {
      isCustom: true,
      sourceId: null,
      pageNumber: null,
      citationType: 'custom',
      formattedText: footnoteForm.value.formattedText.trim(),
    };
  }

  const source = sources.value.find((s) => s.id === Number(footnoteForm.value.sourceId));
  const citation =
    footnoteForm.value.formattedText.trim() ||
    (source ? formatTurkishFootnoteFull(source, footnoteForm.value.pageNumber) : '');

  return {
    isCustom: false,
    sourceId: Number(footnoteForm.value.sourceId),
    pageNumber: Number(footnoteForm.value.pageNumber),
    citationType: source?.sourceType ?? 'book',
    formattedText: citation,
  };
}

function closeFootnoteModal() {
  editingFootnotePos.value = null;
  showFootnoteModal.value = false;
}

function saveFootnote() {
  if (footnoteSaveDisabled.value) return;

  const attrs = buildFootnoteAttrs();

  if (editingFootnotePos.value !== null) {
    editor.value
      ?.chain()
      .focus()
      .setNodeSelection(editingFootnotePos.value)
      .updateAttributes('academicFootnote', attrs)
      .run();
  } else {
    editor.value
      ?.chain()
      .focus()
      .insertContent({ type: 'academicFootnote', attrs })
      .run();
  }

  closeFootnoteModal();
}

async function checkFootnotes() {
  if (!editor.value || !showCheckFootnotes.value) return;

  checkFootnotesLoading.value = true;
  try {
    const neededIds = [];
    editor.value.state.doc.descendants((node) => {
      if (node.type.name !== 'academicFootnote' || isExcludedFromFootnoteCheck(node.attrs)) return;
      const id = Number(node.attrs.sourceId);
      if (Number.isFinite(id)) neededIds.push(id);
    });

    await loadSources({ ids: [...new Set(neededIds)] });
    const sourceMap = new Map(sources.value.map((source) => [source.id, source]));
    let updated = 0;
    let skippedCustom = 0;
    let skippedOther = 0;

    const footnotes = [];
    editor.value.state.doc.descendants((node, pos) => {
      if (node.type.name !== 'academicFootnote') return;
      footnotes.push({ pos, attrs: { ...node.attrs } });
    });

    const updates = buildFootnoteCitationUpdates(footnotes, sourceMap);
    const { state, view } = editor.value;
    let tr = state.tr;
    let changed = false;

    for (const item of updates) {
      if (item.skip) {
        if (item.reason === 'custom') skippedCustom += 1;
        else skippedOther += 1;
        continue;
      }
      if (!item.changed) continue;

      tr = tr.setNodeMarkup(item.pos, undefined, item.attrs);
      changed = true;
      updated += 1;
    }

    if (changed) {
      view.dispatch(tr);
      saveCycleActive = false;
      await saveContent(editor.value.getJSON(), { silent: false });
    }

    const skipped = skippedCustom + skippedOther;

    if (footnotes.length === 0) {
      toast.info(t('editor.checkFootnotesNone'));
    } else if (updated === 0) {
      toast.info(t('editor.checkFootnotesUpToDate', { skipped, skippedCustom }));
    } else {
      toast.success(t('editor.checkFootnotesDone', { updated, skipped, skippedCustom }));
    }
  } finally {
    checkFootnotesLoading.value = false;
  }
}

async function rewriteSelection() {
  if (!editor.value || !selectedText.value.trim()) return;

  const { from, to } = editor.value.state.selection;
  aiLoading.value = true;
  try {
    const res = await api('/user/ai/rewrite-grammar', {
      method: 'POST',
      body: { selectedText: selectedText.value, projectType: props.projectType },
    });
    aiRewriteState.value = {
      from,
      to,
      originalText: selectedText.value,
      revisedText: res.data?.text ?? '',
      changes: res.data?.changes ?? [],
    };
    showAiRewriteModal.value = true;
  } catch {
    // API toast handles errors.
  } finally {
    aiLoading.value = false;
  }
}

function closeAiRewriteModal() {
  showAiRewriteModal.value = false;
  aiRewriteState.value = {
    from: 0,
    to: 0,
    originalText: '',
    revisedText: '',
    changes: [],
  };
}

function rejectAiRewrite() {
  closeAiRewriteModal();
}

function acceptAiRewrite() {
  const { from, to, revisedText } = aiRewriteState.value;
  if (!revisedText.trim() || !editor.value) return;

  editor.value
    .chain()
    .focus()
    .setTextSelection({ from, to })
    .insertContent(revisedText.trim())
    .run();

  closeAiRewriteModal();
}

function aiChangeCategoryLabel(category) {
  const key = `editor.aiChangeCategory.${category}`;
  const translated = t(key);
  return translated !== key ? translated : category;
}

watch(
  () => props.initialContent,
  (content) => {
    if (editor.value) {
      skipSave = true;
      editor.value.commands.setContent(content ?? buildDefaultContent());
      skipSave = false;
      saveCycleActive = false;
    }
  },
);

watch(
  () => props.canEdit,
  (val) => editor.value?.setEditable(val),
);

watch(
  () => editor.value,
  (ed) => {
    if (ed) setTimeout(() => { skipSave = false; }, 100);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  void flushPendingSave();
  editor.value?.destroy();
});
</script>

<template>
  <div class="flex-1 min-w-0">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <p v-if="title && section !== 'body'" class="text-sm text-slate-500 mb-1">{{ title }}</p>
        <h1 class="text-2xl font-bold">{{ displayTitle }}</h1>
      </div>
      <span v-if="!canEdit" class="text-sm text-slate-500">{{ t('editor.readOnly') }}</span>
    </div>

    <div
      v-if="canEdit"
      class="editor-toolbar sticky top-14 z-20 -mx-1 px-1 py-2 mb-4 bg-slate-100/95 backdrop-blur-sm border-b border-slate-200/80"
    >
      <div class="flex flex-wrap items-center gap-2">
        <div v-if="toolbarConfig.bold || toolbarConfig.italic" class="toolbar-group">
          <button
            v-if="toolbarConfig.bold"
            type="button"
            class="toolbar-btn font-bold"
            :class="{ 'is-active': editor?.isActive('bold') }"
            :title="t('editor.toolbar.bold')"
            @click="runCommand(() => editor?.chain().focus().toggleBold())"
          >
            B
          </button>
          <button
            v-if="toolbarConfig.italic"
            type="button"
            class="toolbar-btn italic"
            :class="{ 'is-active': editor?.isActive('italic') }"
            :title="t('editor.toolbar.italic')"
            @click="runCommand(() => editor?.chain().focus().toggleItalic())"
          >
            I
          </button>
        </div>

        <div v-if="toolbarConfig.headings?.length" class="toolbar-group">
          <button
            v-for="level in toolbarConfig.headings"
            :key="`h${level}`"
            type="button"
            class="toolbar-btn"
            :class="{ 'is-active': editor?.isActive('heading', { level }) }"
            :title="t('editor.toolbar.heading', { level })"
            @click="toggleHeading(level)"
          >
            H{{ level }}
          </button>
        </div>

        <div
          v-if="toolbarConfig.bulletList || toolbarConfig.orderedList || toolbarConfig.blockquote"
          class="toolbar-group"
        >
          <button
            v-if="toolbarConfig.bulletList"
            type="button"
            class="toolbar-btn"
            :class="{ 'is-active': editor?.isActive('bulletList') }"
            :title="t('editor.toolbar.bulletList')"
            @click="runCommand(() => editor?.chain().focus().toggleBulletList())"
          >
            •
          </button>
          <button
            v-if="toolbarConfig.orderedList"
            type="button"
            class="toolbar-btn"
            :class="{ 'is-active': editor?.isActive('orderedList') }"
            :title="t('editor.toolbar.orderedList')"
            @click="runCommand(() => editor?.chain().focus().toggleOrderedList())"
          >
            1.
          </button>
          <button
            v-if="toolbarConfig.blockquote"
            type="button"
            class="toolbar-btn italic"
            :class="{ 'is-active': editor?.isActive('italic') }"
            :title="t('editor.toolbar.blockquote')"
            @click="toggleQuote"
          >
            "
          </button>
        </div>

        <div
          v-if="toolbarConfig.appendixEntries || toolbarConfig.footnotes || showCheckFootnotes || showImageCitations"
          class="toolbar-group"
        >
          <button
            v-if="toolbarConfig.appendixEntries"
            type="button"
            class="toolbar-btn toolbar-btn--label"
            :title="t('editor.appendixHint')"
            @click="openAppendixModal"
          >
            {{ t('editor.addAppendix') }}
          </button>
          <button
            v-if="toolbarConfig.footnotes"
            type="button"
            class="toolbar-btn toolbar-btn--label"
            :title="t('editor.footnoteHint')"
            @click="openFootnoteModal"
          >
            {{ t('editor.addFootnote') }}
          </button>
          <button
            v-if="showImageCitations"
            type="button"
            class="toolbar-btn toolbar-btn--label"
            :title="t('editor.imageCitationHint')"
            @click="openImageCitationPicker"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4" aria-hidden="true">
              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm1 2a1 1 0 100 2h1a1 1 0 100-2H5zm3.707 5.707a1 1 0 00-1.414-1.414L5 12.586V11a1 1 0 10-2 0v3a1 1 0 001 1h3a1 1 0 100-2H6.414l2.293-2.293zM15 7a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd" />
            </svg>
          </button>
          <input
            ref="imageCitationInput"
            type="file"
            accept="image/*"
            capture="environment"
            class="hidden"
            @change="onImageFileSelected"
          />
          <button
            v-if="showCheckFootnotes"
            type="button"
            class="toolbar-btn toolbar-btn--label toolbar-btn--success"
            :disabled="checkFootnotesLoading"
            :title="t('editor.checkFootnotesHint')"
            @click="checkFootnotes"
          >
            {{ checkFootnotesLoading ? t('common.loading') : t('editor.checkFootnotes') }}
          </button>
        </div>

        <div
          v-if="toolbarConfig.bibliographyEntries || showGenerateKaynakca"
          class="toolbar-group"
        >
          <button
            v-if="toolbarConfig.bibliographyEntries"
            type="button"
            class="toolbar-btn toolbar-btn--label"
            :title="t('editor.bibliographyHint')"
            @click="openBibliographyModal"
          >
            {{ t('editor.addBibliography') }}
          </button>
          <button
            v-if="showGenerateKaynakca"
            type="button"
            class="toolbar-btn toolbar-btn--label toolbar-btn--success"
            :disabled="generateKaynakcaLoading"
            :title="t('editor.generateKaynakcaHint')"
            @click="generateKaynakca"
          >
            {{ generateKaynakcaLoading ? t('common.loading') : t('editor.generateKaynakca') }}
          </button>
        </div>

        <div
          v-if="showGenerateKapak || showGenerateOz || showGenerateAbstract"
          class="toolbar-group"
        >
          <button
            v-if="showGenerateOz"
            type="button"
            class="toolbar-btn toolbar-btn--label toolbar-btn--success"
            :disabled="generateOzLoading"
            :title="t('editor.generateOzHint')"
            @click="generateOz"
          >
            {{ generateOzLoading ? t('common.loading') : t('editor.generateOz') }}
          </button>
          <button
            v-if="showGenerateAbstract"
            type="button"
            class="toolbar-btn toolbar-btn--label toolbar-btn--success"
            :disabled="generateAbstractLoading"
            :title="t('editor.generateAbstractHint')"
            @click="generateAbstract"
          >
            {{ generateAbstractLoading ? t('common.loading') : t('editor.generateAbstract') }}
          </button>
          <button
            v-if="showGenerateKapak"
            type="button"
            class="toolbar-btn toolbar-btn--label toolbar-btn--success"
            :disabled="generateKapakLoading"
            :title="t('editor.generateKapakHint')"
            @click="generateKapak"
          >
            {{ generateKapakLoading ? t('common.loading') : t('editor.generateKapak') }}
          </button>
        </div>

        <div class="toolbar-group">
          <button
            v-if="toolbarConfig.ai"
            type="button"
            class="toolbar-btn toolbar-btn--primary"
            :disabled="aiLoading || !selectedText"
            :title="t('editor.aiRewriteHint')"
            :aria-label="t('editor.aiRewrite')"
            @click="rewriteSelection"
          >
            <template v-if="aiLoading">{{ t('common.loading') }}</template>
            <svg
              v-else
              class="toolbar-icon toolbar-icon--gemini"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="gemini-gradient-ai" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#4285F4" />
                  <stop offset="50%" stop-color="#9B72CB" />
                  <stop offset="100%" stop-color="#D96570" />
                </linearGradient>
              </defs>
              <path
                fill="url(#gemini-gradient-ai)"
                d="M12 2.5c.2 2.8 2.4 5 5.2 5.2-2.8.2-5 2.4-5.2 5.2-.2-2.8-2.4-5-5.2-5.2 2.8-.2 5-2.4 5.2-5.2z"
              />
              <path
                fill="url(#gemini-gradient-ai)"
                d="M18.5 12c-.1 1.4-1.1 2.4-2.5 2.5 1.4.1 2.4 1.1 2.5 2.5.1-1.4 1.1-2.4 2.5-2.5-1.4-.1-2.4-1.1-2.5-2.5z"
              />
            </svg>
          </button>
          <button
            type="button"
            class="toolbar-btn toolbar-btn--primary"
            :disabled="driveSyncLoading"
            :title="t('editor.syncToDriveHint')"
            :aria-label="t('editor.syncToDrive')"
            @click="syncToGoogleDrive"
          >
            <template v-if="driveSyncLoading">{{ t('common.loading') }}</template>
            <template v-else>
              <svg class="toolbar-icon toolbar-icon--drive" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0-1.2 4.5h27.5z" fill="#00ac47" />
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
              </svg>
            </template>
          </button>
        </div>
      </div>
    </div>

    <div class="overflow-x-auto pb-8">
      <div
        class="a4-page bg-white shadow-page mx-auto"
        :class="{
          'opacity-90': !canEdit,
          'a4-page--kapak': section === 'kapak',
          'a4-page--ekler': isEklerSection,
          'a4-page--kaynakca': isKaynakcaSection,
        }"
      >
        <div class="a4-page-content">
          <EditorContent :editor="editor" />
        </div>
      </div>
    </div>

    <div
      v-if="showAppendixModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="closeAppendixModal"
    >
      <div class="bg-white rounded-xl p-6 w-full max-w-lg space-y-3">
        <h3 class="font-semibold">{{ appendixModalTitle }}</h3>
        <div class="grid grid-cols-[auto_1fr] gap-3 items-center">
          <label class="text-sm text-slate-600">{{ t('editor.appendixNumber') }}</label>
          <input
            v-model.number="appendixForm.number"
            type="number"
            min="1"
            class="w-full border rounded-lg px-3 py-2"
          />
          <label class="text-sm text-slate-600">{{ t('editor.appendixTitle') }}</label>
          <input
            v-model="appendixForm.title"
            type="text"
            class="w-full border rounded-lg px-3 py-2"
            :placeholder="t('editor.appendixTitlePlaceholder')"
          />
          <label class="text-sm text-slate-600">{{ t('editor.appendixPage') }}</label>
          <input
            v-model="appendixForm.page"
            type="text"
            inputmode="numeric"
            class="w-full border rounded-lg px-3 py-2"
            :placeholder="t('editor.pageNumber')"
          />
        </div>
        <div class="flex gap-2 justify-end">
          <button
            v-if="editingAppendixPos !== null"
            type="button"
            class="px-4 py-2 border border-red-200 text-red-700 rounded-lg mr-auto"
            @click="deleteAppendixEntry"
          >
            {{ t('editor.deleteAppendix') }}
          </button>
          <button type="button" class="px-4 py-2 border rounded-lg" @click="closeAppendixModal">
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg"
            :disabled="!appendixForm.title.trim() || !String(appendixForm.page).trim()"
            @click="saveAppendixEntry"
          >
            {{ t('common.save') }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showBibliographyModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="closeBibliographyModal"
    >
      <div class="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
        <h3 class="font-semibold">{{ bibliographyModalTitle }}</h3>
        <input
          v-model="sourceSearchQuery"
          type="search"
          class="w-full border rounded-lg px-3 py-2 text-sm"
          :placeholder="t('editor.searchSource')"
          @input="searchSourcesDebounced"
        />
        <select v-model="bibliographyForm.sourceId" class="w-full border rounded-lg px-3 py-2">
          <option value="">{{ sourcesLoading ? t('common.loading') : t('editor.selectSource') }}</option>
          <option v-for="s in sources" :key="s.id" :value="s.id">{{ formatSourceOptionLabel(s) }}</option>
        </select>
        <div class="flex gap-2 justify-end">
          <button
            v-if="editingBibliographyPos !== null"
            type="button"
            class="px-4 py-2 border border-red-200 text-red-700 rounded-lg mr-auto"
            @click="deleteBibliographyEntry"
          >
            {{ t('editor.deleteBibliography') }}
          </button>
          <button type="button" class="px-4 py-2 border rounded-lg" @click="closeBibliographyModal">
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg"
            :disabled="!bibliographyForm.sourceId"
            @click="saveBibliographyEntry"
          >
            {{ t('common.save') }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showAiRewriteModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="rejectAiRewrite"
    >
      <div class="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <h3 class="font-semibold text-lg">{{ t('editor.aiRewriteTitle') }}</h3>

        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700">{{ t('editor.aiRevised') }}</label>
          <textarea
            v-model="aiRewriteState.revisedText"
            rows="8"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm leading-relaxed"
          />
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700">{{ t('editor.aiOriginal') }}</label>
          <div class="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 whitespace-pre-wrap">
            {{ aiRewriteState.originalText }}
          </div>
        </div>

        <div v-if="aiRewriteState.changes.length" class="space-y-2">
          <h4 class="text-sm font-medium text-slate-700">{{ t('editor.aiChangesTitle') }}</h4>
          <ul class="text-sm space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y">
            <li
              v-for="(change, index) in aiRewriteState.changes"
              :key="index"
              class="p-3 space-y-1"
            >
              <span class="inline-block text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {{ aiChangeCategoryLabel(change.category) }}
              </span>
              <p>
                <span class="line-through text-red-700/80">{{ change.original }}</span>
                <span class="mx-1 text-slate-400">→</span>
                <span class="text-emerald-800 font-medium">{{ change.revised }}</span>
              </p>
              <p v-if="change.note" class="text-slate-500 text-xs">{{ change.note }}</p>
            </li>
          </ul>
        </div>
        <p v-else class="text-sm text-slate-500">{{ t('editor.aiNoChanges') }}</p>

        <div class="flex gap-2 justify-end pt-2">
          <button
            type="button"
            class="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            @click="rejectAiRewrite"
          >
            {{ t('editor.aiReject') }}
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            :disabled="!aiRewriteState.revisedText.trim()"
            @click="acceptAiRewrite"
          >
            {{ t('editor.aiAccept') }}
          </button>
        </div>
      </div>
    </div>

    <ImageCitationModal
      v-if="showImageCitationModal && projectId"
      :project-id="projectId"
      :image-file="imageCitationFile"
      :citation-image-id="editingCitationImageId"
      :initial-source-id="imageCitationInitialSourceId"
      :initial-ocr-text="imageCitationInitialOcr"
      :initial-page-number="imageCitationInitialPageNumber"
      :initial-citation-text="imageCitationInitialCitationText"
      @saved="onImageCitationSaved"
      @close="closeImageCitationModal"
    />

    <div
      v-if="showFootnoteModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
        <h3 class="font-semibold">{{ footnoteModalTitle }}</h3>
        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input v-model="footnoteForm.isCustom" type="checkbox" class="rounded border-slate-300" />
          <span>{{ t('editor.customFootnote') }}</span>
        </label>
        <template v-if="!footnoteForm.isCustom">
          <input
            v-model="sourceSearchQuery"
            type="search"
            class="w-full border rounded-lg px-3 py-2 text-sm"
            :placeholder="t('editor.searchSource')"
            @input="searchSourcesDebounced"
          />
          <select v-model="footnoteForm.sourceId" class="w-full border rounded-lg px-3 py-2">
            <option value="">{{ sourcesLoading ? t('common.loading') : t('editor.selectSource') }}</option>
            <option v-for="s in sources" :key="s.id" :value="s.id">{{ formatSourceOptionLabel(s) }}</option>
          </select>
          <input
            v-model="footnoteForm.pageNumber"
            type="number"
            min="1"
            class="w-full border rounded-lg px-3 py-2"
            :placeholder="t('editor.pageNumber')"
          />
        </template>
        <textarea
          v-model="footnoteForm.formattedText"
          rows="4"
          class="w-full border rounded-lg px-3 py-2 text-sm"
          :placeholder="footnoteCitationPlaceholder"
        />
        <div class="flex gap-2 justify-end">
          <button type="button" class="px-4 py-2 border rounded-lg" @click="closeFootnoteModal">
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg"
            :disabled="footnoteSaveDisabled"
            @click="saveFootnote"
          >
            {{ t('common.save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar-group {
  @apply inline-flex shrink-0 rounded-lg border border-slate-300 bg-white shadow-sm overflow-hidden;
}

.toolbar-btn {
  @apply px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[2.25rem] flex items-center justify-center;
}

.toolbar-group .toolbar-btn:not(:last-child) {
  @apply border-r border-slate-300;
}

.toolbar-btn.is-active {
  @apply bg-indigo-50 text-indigo-700;
}

.toolbar-btn--label {
  @apply px-3 font-medium whitespace-nowrap;
}

.toolbar-btn--primary {
  @apply text-indigo-700 hover:bg-indigo-50;
}

.toolbar-icon {
  @apply w-4 h-4;
}

.toolbar-icon--drive {
  @apply w-[1.125rem] h-[1rem];
}

.toolbar-icon--gemini {
  @apply w-[1.125rem] h-[1.125rem];
}

.toolbar-btn--success {
  @apply text-emerald-800 hover:bg-emerald-50;
}
:deep(.academic-footnote) {
  @apply relative inline-flex items-center align-super mx-0.5 cursor-pointer select-none;
}

:deep(.academic-footnote-icon) {
  @apply inline-flex items-center justify-center w-[1.1rem] h-[1.1rem] rounded-sm bg-indigo-100 text-indigo-700 leading-none;
}

:deep(.academic-footnote--image .academic-footnote-icon) {
  @apply bg-emerald-100 text-emerald-700;
}

:deep(.academic-footnote-icon svg) {
  @apply w-3 h-3;
}

:deep(.academic-footnote-tooltip) {
  @apply absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2 hidden z-30;
  @apply w-max max-w-xs px-3 py-2 text-xs leading-snug text-slate-700 bg-white border border-slate-200 rounded-lg shadow-lg;
  @apply whitespace-normal text-left pointer-events-none;
}

:deep(.academic-footnote:hover .academic-footnote-tooltip),
:deep(.academic-footnote.is-preview .academic-footnote-tooltip) {
  @apply block;
}

.a4-page--kapak :deep(.ProseMirror) {
  text-align: center;
  font-family: 'Times New Roman', Times, serif;
  min-height: 100%;
  padding-top: 1.5rem;
}

.a4-page--kapak :deep(.ProseMirror h2) {
  font-size: 14pt;
  line-height: 1.5;
  margin: 2rem 0;
  font-weight: 700;
}

.a4-page--kapak :deep(.ProseMirror p) {
  margin: 0.35rem 0;
  line-height: 1.4;
}

.a4-page--ekler :deep(.ProseMirror h1) {
  text-align: center;
  font-size: 14pt;
  font-weight: 700;
  margin: 0 0 1.5rem;
  text-transform: uppercase;
}

.a4-page--ekler :deep(.appendix-entry) {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  margin-bottom: 12pt;
  padding-left: 3.5em;
  line-height: 1.5;
  font-size: 12pt;
  font-family: 'Times New Roman', Times, serif;
}

.a4-page--ekler :deep(.appendix-label) {
  width: 3.5em;
  margin-left: -3.5em;
  flex-shrink: 0;
  font-weight: 700;
  margin-right: 0.25em;
}

.a4-page--ekler :deep(.appendix-title) {
  flex: 0 1 auto;
  font-weight: 400;
  max-width: calc(100% - 4em);
}

.a4-page--ekler :deep(.appendix-leader) {
  flex: 1 1 2em;
  min-width: 1.5em;
  margin: 0 0.35em;
  border-bottom: 1px dotted currentColor;
  height: 0;
  align-self: baseline;
  position: relative;
  top: -0.12em;
}

.a4-page--ekler :deep(.appendix-page) {
  flex: 0 0 auto;
  font-weight: 700;
}

.a4-page--kaynakca :deep(.ProseMirror h1) {
  text-align: center;
  font-size: 14pt;
  font-weight: 700;
  margin: 0 0 1.5rem;
  text-transform: uppercase;
}

.a4-page--kaynakca :deep(.bibliography-entry) {
  display: grid;
  grid-template-columns: 11em 1fr;
  gap: 0 0.5em;
  margin-bottom: 12pt;
  line-height: 1.5;
  font-size: 12pt;
  font-family: 'Times New Roman', Times, serif;
}

.a4-page--kaynakca :deep(.bibliography-author) {
  text-align: left;
}

.a4-page--kaynakca :deep(.bibliography-detail) {
  text-align: left;
}

.a4-page--kaynakca :deep(.bibliography-bold) {
  font-weight: 700;
}
</style>

<style>
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #94a3b8;
  pointer-events: none;
  height: 0;
}
</style>
