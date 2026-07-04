<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '@/api/client';
import { buildAuthorsDisplay } from '@/utils/author-citation.js';
import { formatTurkishFootnoteFull } from '@/utils/turkish-footnote.js';

const props = defineProps({
  projectId: { type: Number, required: true },
  imageFile: { type: Object, default: null },
  citationImageId: { type: Number, default: null },
  initialSourceId: { type: [Number, String], default: '' },
  initialOcrText: { type: String, default: '' },
  initialPageNumber: { type: [Number, String], default: null },
  initialCitationText: { type: String, default: '' },
});

const emit = defineEmits(['saved', 'deleted', 'close']);

const { t } = useI18n();

const isEditing = computed(() => props.citationImageId != null);
const previewUrl = ref('');
const remoteImageUrl = ref('');
const ocrText = ref('');
const pageNumber = ref(null);
const citationText = ref('');
const citationTextTouched = ref(false);
const ocrLoading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const loading = ref(false);

const sourceMode = ref('existing');
const sourceSearchQuery = ref('');
const sources = ref([]);
const sourcesLoading = ref(false);
const selectedSourceId = ref('');
let sourceSearchTimer = null;

const newSource = ref({
  sourceType: 'book',
  title: '',
  authorFirstName: '',
  authorLastName: '',
  publisher: '',
  publicationPlace: '',
  publicationYear: new Date().getFullYear(),
});

const sourceTypes = ['book', 'article', 'newspaper', 'encyclopedia', 'thesis', 'other'];
const isNewBook = computed(() => newSource.value.sourceType === 'book');
const isNewArticle = computed(() => newSource.value.sourceType === 'article');

const displayImageUrl = computed(() => remoteImageUrl.value || previewUrl.value);

const sourceReady = computed(() => {
  if (sourceMode.value === 'existing') return Boolean(selectedSourceId.value);
  return (
    newSource.value.title.trim() &&
    newSource.value.authorLastName.trim() &&
    newSource.value.authorFirstName.trim()
  );
});

const canSave = computed(() => {
  if (!isEditing.value && !props.imageFile) return false;
  if (!sourceReady.value) return false;
  const page = Number(pageNumber.value);
  return Number.isFinite(page) && page > 0;
});

function resolveCitationText() {
  const trimmed = citationText.value.trim();
  if (trimmed) return trimmed;

  const page = Number(pageNumber.value);
  const source = getActiveSource();
  if (!source || !Number.isFinite(page) || page <= 0) return '';
  return formatTurkishFootnoteFull(source, page);
}

function revokePreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = '';
  }
}

function setPreviewFromFile(file) {
  revokePreview();
  if (file) previewUrl.value = URL.createObjectURL(file);
}

function buildNewSourcePreview() {
  return {
    sourceType: newSource.value.sourceType,
    title: newSource.value.title.trim(),
    authorFirstName: newSource.value.authorFirstName.trim(),
    authorLastName: newSource.value.authorLastName.trim(),
    publisher: newSource.value.publisher.trim(),
    publicationPlace: newSource.value.publicationPlace.trim(),
    publicationYear: newSource.value.publicationYear,
  };
}

function getActiveSource() {
  if (sourceMode.value === 'existing') {
    const id = Number(selectedSourceId.value);
    return sources.value.find((s) => s.id === id) ?? null;
  }
  if (sourceReady.value) return buildNewSourcePreview();
  return null;
}

function maybeSuggestCitation() {
  if (citationTextTouched.value) return;
  const page = Number(pageNumber.value);
  if (!sourceReady.value || !Number.isFinite(page) || page <= 0) return;

  const source = getActiveSource();
  if (!source) return;

  citationText.value = formatTurkishFootnoteFull(source, page);
}

async function loadSources(q = '') {
  sourcesLoading.value = true;
  try {
    const res = await api('/user/library/sources', {
      query: { q, limit: 50, page: 1 },
      silent: true,
    });
    sources.value = res.data?.items ?? [];
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
    // ignore
  }
}

function searchSourcesDebounced() {
  clearTimeout(sourceSearchTimer);
  sourceSearchTimer = setTimeout(() => {
    void loadSources(sourceSearchQuery.value.trim());
  }, 300);
}

function formatSourceLabel(source) {
  const author = buildAuthorsDisplay(source);
  return author ? `${source.title} (${author})` : source.title;
}

function buildNewSourcePayload() {
  const body = {
    sourceType: newSource.value.sourceType,
    title: newSource.value.title.trim(),
    authorFirstName: newSource.value.authorFirstName.trim(),
    authorLastName: newSource.value.authorLastName.trim(),
    publicationYear: newSource.value.publicationYear,
  };
  if (isNewBook.value || isNewArticle.value) {
    body.publisher = newSource.value.publisher.trim();
  }
  if (isNewBook.value && newSource.value.publicationPlace.trim()) {
    body.publicationPlace = newSource.value.publicationPlace.trim();
  }
  return body;
}

async function loadRemoteImage(citationImageId) {
  const res = await api(
    `/user/projects/${props.projectId}/citation-images/${citationImageId}/stream-token`,
    { method: 'POST', silent: true },
  );
  const base = import.meta.env.VITE_API_URL ?? '/api/v1';
  remoteImageUrl.value = `${base}${res.data.streamUrl}`;
}

async function loadExistingCitation() {
  if (!props.citationImageId) return;
  loading.value = true;
  try {
    const res = await api(
      `/user/projects/${props.projectId}/citation-images/${props.citationImageId}`,
      { silent: true },
    );
    ocrText.value = res.data?.ocrText ?? props.initialOcrText ?? '';
    pageNumber.value = res.data?.pageNumber ?? props.initialPageNumber ?? null;
    citationText.value = res.data?.citationText ?? props.initialCitationText ?? '';
    citationTextTouched.value = Boolean(citationText.value.trim());
    selectedSourceId.value = res.data?.sourceId ? String(res.data.sourceId) : '';
    if (selectedSourceId.value) {
      sourceMode.value = 'existing';
      await ensureSourceInList(res.data.sourceId);
    }
    await loadRemoteImage(props.citationImageId);
  } finally {
    loading.value = false;
  }
}

async function buildOcrFormData() {
  const formData = new FormData();
  if (props.imageFile) {
    formData.append('image', props.imageFile);
  } else if (remoteImageUrl.value) {
    const blob = await fetch(remoteImageUrl.value).then((r) => r.blob());
    formData.append('image', blob, 'citation.jpg');
  }
  return formData;
}

async function runOcr() {
  if (!props.imageFile && !displayImageUrl.value) return;

  ocrLoading.value = true;
  try {
    const formData = await buildOcrFormData();
    const res = await api('/user/ai/screenshot-ocr', { method: 'POST', formData });
    ocrText.value = res.data?.text ?? '';
  } finally {
    ocrLoading.value = false;
  }
}

async function runOttomanOcr() {
  if (!props.imageFile && !displayImageUrl.value) return;

  ocrLoading.value = true;
  try {
    const formData = await buildOcrFormData();
    const res = await api('/user/ai/screenshot-ocr-ottoman', { method: 'POST', formData });
    ocrText.value = res.data?.text ?? '';
  } finally {
    ocrLoading.value = false;
  }
}

async function saveCitation() {
  if (!canSave.value) return;

  saving.value = true;
  try {
    let data;
    const page = Number(pageNumber.value);
    const citation = resolveCitationText();
    const ocr = ocrText.value.trim();

    if (isEditing.value) {
      const body = {
        ocrText: ocr,
        pageNumber: page,
        citationText: citation,
      };
      if (sourceMode.value === 'existing') {
        body.sourceId = Number(selectedSourceId.value);
      } else {
        body.newSource = buildNewSourcePayload();
      }
      const res = await api(
        `/user/projects/${props.projectId}/citation-images/${props.citationImageId}`,
        { method: 'PUT', body },
      );
      data = res.data;
    } else {
      const formData = new FormData();
      formData.append('image', props.imageFile);
      formData.append('ocrText', ocr);
      formData.append('pageNumber', String(page));
      formData.append('citationText', citation);
      if (sourceMode.value === 'existing') {
        formData.append('sourceId', String(selectedSourceId.value));
      } else {
        formData.append('newSource', JSON.stringify(buildNewSourcePayload()));
      }
      const res = await api(`/user/projects/${props.projectId}/citation-images`, {
        method: 'POST',
        formData,
      });
      data = res.data;
    }

    emit('saved', {
      isImageCitation: true,
      isCustom: false,
      imageCitationId: data.id,
      sourceId: data.sourceId,
      ocrText: data.ocrText ?? ocr,
      citationType: 'image',
      pageNumber: data.pageNumber ?? page,
      formattedText: data.formattedText ?? data.citationText ?? citation,
    });
  } finally {
    saving.value = false;
  }
}

async function deleteCitation() {
  if (!isEditing.value || !props.citationImageId) return;
  if (!confirm(t('editor.deleteImageCitationConfirm'))) return;

  deleting.value = true;
  try {
    await api(`/user/projects/${props.projectId}/citation-images/${props.citationImageId}`, {
      method: 'DELETE',
    });
    emit('deleted');
  } finally {
    deleting.value = false;
  }
}

function onCitationTextInput() {
  citationTextTouched.value = true;
}

watch(
  () => props.imageFile,
  (file) => setPreviewFromFile(file),
  { immediate: true },
);

watch(
  () => props.citationImageId,
  (id) => {
    if (id) void loadExistingCitation();
  },
  { immediate: true },
);

watch(
  [sourceReady, pageNumber, selectedSourceId, sourceMode, () => ({ ...newSource.value })],
  () => maybeSuggestCitation(),
);

onBeforeUnmount(revokePreview);

void loadSources();
if (props.initialSourceId) {
  selectedSourceId.value = String(props.initialSourceId);
  void ensureSourceInList(props.initialSourceId);
}
if (props.initialOcrText && !props.citationImageId) {
  ocrText.value = props.initialOcrText;
}
if (props.initialPageNumber != null && props.initialPageNumber !== '') {
  pageNumber.value = Number(props.initialPageNumber);
}
if (props.initialCitationText) {
  citationText.value = props.initialCitationText;
  citationTextTouched.value = true;
}
</script>

<template>
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  >
    <div class="bg-white rounded-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 space-y-4">
      <h3 class="font-semibold text-lg">
        {{ isEditing ? t('editor.imageCitationEdit') : t('editor.imageCitationTitle') }}
      </h3>

      <p v-if="loading" class="text-slate-500 text-sm">{{ t('common.loading') }}</p>

      <div class="space-y-3 border-t border-slate-100 pt-4">
        <h4 class="text-sm font-medium text-slate-700">{{ t('editor.imageCitationSource') }}</h4>

        <div class="flex flex-wrap gap-4 text-sm">
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="sourceMode" type="radio" value="existing" />
            {{ t('editor.imageCitationExistingSource') }}
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="sourceMode" type="radio" value="new" />
            {{ t('editor.imageCitationNewSource') }}
          </label>
        </div>

        <template v-if="sourceMode === 'existing'">
          <input
            v-model="sourceSearchQuery"
            type="search"
            class="w-full border rounded-lg px-3 py-2 text-sm"
            :placeholder="t('editor.searchSource')"
            @input="searchSourcesDebounced"
          />
          <select v-model="selectedSourceId" class="w-full border rounded-lg px-3 py-2">
            <option value="">{{ sourcesLoading ? t('common.loading') : t('editor.selectSource') }}</option>
            <option v-for="s in sources" :key="s.id" :value="s.id">{{ formatSourceLabel(s) }}</option>
          </select>
        </template>

        <template v-else>
          <div class="grid sm:grid-cols-2 gap-3">
            <select v-model="newSource.sourceType" class="w-full border rounded-lg px-3 py-2 text-sm">
              <option v-for="type in sourceTypes" :key="type" :value="type">
                {{ t(`library.types.${type}`) }}
              </option>
            </select>
            <input
              v-model="newSource.authorLastName"
              class="w-full border rounded-lg px-3 py-2 text-sm"
              :placeholder="t('library.authorLastName')"
            />
            <input
              v-model="newSource.authorFirstName"
              class="w-full border rounded-lg px-3 py-2 text-sm"
              :placeholder="t('library.authorFirstName')"
            />
            <input
              v-model="newSource.title"
              class="w-full border rounded-lg px-3 py-2 text-sm sm:col-span-2"
              :placeholder="t('library.sourceTitle')"
            />
            <template v-if="isNewBook">
              <input
                v-model="newSource.publicationPlace"
                class="w-full border rounded-lg px-3 py-2 text-sm"
                :placeholder="t('library.publicationPlace')"
              />
              <input
                v-model="newSource.publisher"
                class="w-full border rounded-lg px-3 py-2 text-sm"
                :placeholder="t('library.publisher')"
              />
            </template>
            <template v-else-if="isNewArticle">
              <input
                v-model="newSource.publisher"
                class="w-full border rounded-lg px-3 py-2 text-sm sm:col-span-2"
                :placeholder="t('library.journal')"
              />
            </template>
            <input
              v-model.number="newSource.publicationYear"
              type="number"
              class="w-full border rounded-lg px-3 py-2 text-sm"
              :placeholder="t('library.year')"
            />
          </div>
        </template>
      </div>

      <div v-if="sourceReady" class="space-y-3 border-t border-slate-100 pt-4">
        <h4 class="text-sm font-medium text-slate-700">{{ t('editor.imageCitationDetails') }}</h4>
        <div>
          <label class="block text-sm text-slate-600 mb-1">{{ t('editor.pageNumber') }}</label>
          <input
            v-model.number="pageNumber"
            type="number"
            min="1"
            class="w-full border rounded-lg px-3 py-2 text-sm"
            :placeholder="t('editor.pageNumber')"
          />
        </div>
        <div>
          <label class="block text-sm text-slate-600 mb-1">{{ t('editor.imageCitationText') }}</label>
          <textarea
            v-model="citationText"
            rows="4"
            class="w-full border rounded-lg px-3 py-2 text-sm leading-relaxed"
            :placeholder="t('editor.imageCitationTextPlaceholder')"
            @input="onCitationTextInput"
          />
        </div>
      </div>

      <div v-if="displayImageUrl" class="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
        <img :src="displayImageUrl" alt="" class="max-h-64 w-full object-contain mx-auto" />
      </div>

      <div class="space-y-2 border-t border-slate-100 pt-4">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <label class="text-sm font-medium text-slate-700">{{ t('editor.imageCitationOcr') }}</label>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="text-sm px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
              :disabled="ocrLoading || (!imageFile && !displayImageUrl)"
              @click="runOcr"
            >
              {{ ocrLoading ? t('common.loading') : t('editor.imageCitationRunOcr') }}
            </button>
            <button
              type="button"
              class="text-sm px-3 py-1.5 rounded-lg border border-amber-200 text-amber-800 hover:bg-amber-50 disabled:opacity-50"
              :disabled="ocrLoading || (!imageFile && !displayImageUrl)"
              @click="runOttomanOcr"
            >
              {{ ocrLoading ? t('common.loading') : t('editor.imageCitationRunOcrOttoman') }}
            </button>
          </div>
        </div>
        <p class="text-xs text-slate-500">{{ t('editor.imageCitationOcrNote') }}</p>
        <textarea
          v-model="ocrText"
          rows="6"
          class="w-full border rounded-lg px-3 py-2 text-sm leading-relaxed bg-slate-50"
          :placeholder="t('editor.imageCitationOcrPlaceholder')"
        />
      </div>

      <div class="flex gap-2 justify-end pt-2">
        <button
          v-if="isEditing"
          type="button"
          class="px-4 py-2 border border-red-200 text-red-700 rounded-lg mr-auto disabled:opacity-50"
          :disabled="deleting || saving"
          @click="deleteCitation"
        >
          {{ deleting ? t('common.loading') : t('editor.deleteImageCitation') }}
        </button>
        <button type="button" class="px-4 py-2 border rounded-lg" @click="emit('close')">
          {{ t('common.cancel') }}
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
          :disabled="!canSave || saving"
          @click="saveCitation"
        >
          {{ saving ? t('common.loading') : t('common.save') }}
        </button>
      </div>
    </div>
  </div>
</template>
