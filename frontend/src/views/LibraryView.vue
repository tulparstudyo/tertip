<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from '@/api/client';
import { i18n } from '@/i18n';
import { toast } from '@/composables/useToast';
import { formatMlaBibliography } from '@/utils/mla-citation.js';
import { buildAuthorsDisplay, resolveAuthorFields } from '@/utils/author-citation.js';
import LibraryPdfModal from '@/components/library/LibraryPdfModal.vue';

const { t } = useI18n();
const route = useRoute();

const uploadProjectId = computed(() => {
  const id = Number(route.query.projectId);
  return Number.isFinite(id) && id > 0 ? id : null;
});

const sources = ref([]);
const loading = ref(true);
const pageLoading = ref(false);
const showForm = ref(false);
const pdfUploadInput = ref(null);
const pdfUploadSourceId = ref(null);
const excelImportInput = ref(null);
const excelImporting = ref(false);
const saving = ref(false);
const editingSourceId = ref(null);

const searchQuery = ref('');
const filterType = ref('');
const page = ref(1);
const pageSize = ref(20);
const pagination = ref({ total: 0, totalPages: 1 });
const pdfViewer = ref({ sourceId: null, title: '' });

const emptyMessage = computed(() => {
  if (searchQuery.value.trim() || filterType.value) return t('library.emptySearch');
  return t('library.empty');
});

const sourceTypes = ['book', 'article', 'newspaper', 'encyclopedia', 'thesis', 'other'];

let searchDebounceTimer = null;

function emptyForm() {
  return {
    sourceType: 'book',
    title: '',
    authorFirstName: '',
    authorLastName: '',
    publisher: '',
    publicationPlace: '',
    publicationYear: new Date().getFullYear(),
    volume: '',
    issue: '',
    pages: '',
  };
}

const form = ref(emptyForm());

const isBook = computed(() => form.value.sourceType === 'book');
const isArticle = computed(() => form.value.sourceType === 'article');
const usesMlaFields = computed(() => isBook.value || isArticle.value);

const mlaPreview = computed(() => {
  if (!usesMlaFields.value || !form.value.title.trim()) return '';
  return formatMlaBibliography(form.value);
});

const isEditing = computed(() => editingSourceId.value !== null);

const formTitle = computed(() =>
  isEditing.value ? t('library.editSource') : t('library.addSource'),
);

const showingFrom = computed(() =>
  pagination.value.total === 0 ? 0 : (page.value - 1) * pageSize.value + 1,
);

const showingTo = computed(() =>
  Math.min(page.value * pageSize.value, pagination.value.total),
);

const pageNumbers = computed(() => {
  const total = pagination.value.totalPages;
  const current = page.value;
  const pages = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
});

async function loadSources({ pageChange = false } = {}) {
  const isInitialLoad = loading.value && sources.value.length === 0;
  if (isInitialLoad) {
    loading.value = true;
  } else if (pageChange) {
    pageLoading.value = true;
  } else {
    loading.value = true;
  }

  try {
    const res = await api('/user/library/sources', {
      query: {
        page: page.value,
        limit: pageSize.value,
        q: searchQuery.value.trim(),
        sourceType: filterType.value || undefined,
      },
      silent: true,
    });
    sources.value = res.data?.items ?? [];
    pagination.value = res.data?.pagination ?? { total: 0, totalPages: 1 };
  } finally {
    loading.value = false;
    pageLoading.value = false;
  }
}

function scheduleSearch() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    page.value = 1;
    void loadSources();
  }, 350);
}

function onSearchInput() {
  scheduleSearch();
}

function onFilterChange() {
  page.value = 1;
  void loadSources();
}

function goToPage(nextPage) {
  if (nextPage < 1 || nextPage > pagination.value.totalPages) return;
  page.value = nextPage;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  void loadSources({ pageChange: true });
}

function resetForm() {
  form.value = emptyForm();
}

function openCreateForm() {
  editingSourceId.value = null;
  resetForm();
  showForm.value = true;
}

async function openEditForm(source) {
  editingSourceId.value = source.id;
  const { firstName, lastName } = resolveAuthorFields(source);
  form.value = {
    sourceType: source.sourceType,
    title: source.title ?? '',
    authorFirstName: firstName,
    authorLastName: lastName,
    publisher: source.publisher ?? '',
    publicationPlace: source.publicationPlace ?? '',
    publicationYear: source.publicationYear ?? new Date().getFullYear(),
    volume: source.volume ?? '',
    issue: source.issue ?? '',
    pages: source.pages ?? '',
  };
  showForm.value = true;
  await nextTick();
  document.getElementById('library-source-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeForm() {
  showForm.value = false;
  editingSourceId.value = null;
  resetForm();
}

function sourceDisplayAuthor(source) {
  return buildAuthorsDisplay(source);
}

function buildPayload() {
  const body = {
    sourceType: form.value.sourceType,
    title: form.value.title.trim(),
    authorFirstName: form.value.authorFirstName.trim(),
    authorLastName: form.value.authorLastName.trim(),
    publicationYear: form.value.publicationYear,
    publicationPlace: form.value.publicationPlace.trim() || null,
    pages: form.value.pages.trim() || null,
  };

  if (form.value.publisher.trim()) {
    body.publisher = form.value.publisher.trim();
  }

  if (isArticle.value) {
    body.volume = form.value.volume.trim() || null;
    body.issue = form.value.issue.trim() || null;
  }

  return body;
}

async function saveSource() {
  saving.value = true;
  try {
    const body = buildPayload();
    if (isEditing.value) {
      await api(`/user/library/sources/${editingSourceId.value}`, { method: 'PUT', body });
    } else {
      await api('/user/library/sources', { method: 'POST', body });
    }
    closeForm();
    await loadSources();
  } finally {
    saving.value = false;
  }
}

function openPdfUpload(sourceId) {
  pdfUploadSourceId.value = sourceId;
  pdfUploadInput.value?.click();
}

async function onPdfUploadSelected(event) {
  const sourceId = pdfUploadSourceId.value;
  const file = event.target.files?.[0];
  event.target.value = '';
  pdfUploadSourceId.value = null;
  if (!sourceId || !file) return;

  const formData = new FormData();
  formData.append('file', file);
  if (uploadProjectId.value) {
    formData.append('projectId', String(uploadProjectId.value));
  }

  try {
    await api(`/user/library/sources/${sourceId}/upload`, {
      method: 'POST',
      formData,
    });
    await loadSources({ pageChange: true });
  } catch {
    // API toast handles errors.
  }
}

function openPdfViewer(source) {
  if (!source.hasPdf) return;
  pdfViewer.value = { sourceId: source.id, title: source.title };
}

function closePdfViewer() {
  pdfViewer.value = { sourceId: null, title: '' };
}

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

async function exportExcel() {
  try {
    const token = localStorage.getItem('tertip_access_token');
    const res = await fetch(`${API_BASE}/user/library/sources/export`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Accept-Language': i18n.global.locale.value,
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.message ?? t('common.error'));
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tertip-kutuphane-${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.error(t('common.error'));
  }
}

function openExcelImport() {
  excelImportInput.value?.click();
}

async function onExcelImportSelected(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;

  excelImporting.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    await api('/user/library/sources/import', {
      method: 'POST',
      formData,
      notify: true,
    });
    page.value = 1;
    await loadSources();
  } finally {
    excelImporting.value = false;
  }
}

watch(pageSize, () => {
  page.value = 1;
  void loadSources();
});

onMounted(loadSources);
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h1 class="text-2xl font-bold">{{ t('library.title') }}</h1>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm"
          @click="exportExcel"
        >
          {{ t('library.exportExcel') }}
        </button>
        <button
          type="button"
          class="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm disabled:opacity-50"
          :disabled="excelImporting"
          @click="openExcelImport"
        >
          {{ excelImporting ? t('library.importingExcel') : t('library.importExcel') }}
        </button>
        <input
          ref="excelImportInput"
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          class="hidden"
          @change="onExcelImportSelected"
        />
        <button
          type="button"
          class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          @click="openCreateForm"
        >
          {{ t('library.add') }}
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-page p-4 mb-6 border border-slate-100 flex flex-wrap gap-3 items-end">
      <div class="flex-1 min-w-[200px]">
        <label class="block text-sm mb-1 text-slate-600">{{ t('library.search') }}</label>
        <input
          v-model="searchQuery"
          type="search"
          class="w-full border rounded-lg px-3 py-2"
          :placeholder="t('library.searchPlaceholder')"
          @input="onSearchInput"
        />
      </div>
      <div class="w-full sm:w-44">
        <label class="block text-sm mb-1 text-slate-600">{{ t('library.sourceType') }}</label>
        <select v-model="filterType" class="w-full border rounded-lg px-3 py-2" @change="onFilterChange">
          <option value="">{{ t('library.allTypes') }}</option>
          <option v-for="type in sourceTypes" :key="type" :value="type">
            {{ t(`library.types.${type}`) }}
          </option>
        </select>
      </div>
      <div class="w-full sm:w-32">
        <label class="block text-sm mb-1 text-slate-600">{{ t('library.pageSize') }}</label>
        <select v-model.number="pageSize" class="w-full border rounded-lg px-3 py-2">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>
    </div>

    <form
      v-if="showForm"
      id="library-source-form"
      class="bg-white rounded-xl shadow-page p-6 mb-6 border border-slate-100 space-y-4"
      @submit.prevent="saveSource"
    >
      <h2 class="text-lg font-semibold">{{ formTitle }}</h2>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm mb-1">{{ t('library.sourceType') }}</label>
          <select v-model="form.sourceType" class="w-full border rounded-lg px-3 py-2">
            <option v-for="type in sourceTypes" :key="type" :value="type">
              {{ t(`library.types.${type}`) }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm mb-1">{{ t('library.authorLastName') }}</label>
          <input
            v-model="form.authorLastName"
            required
            class="w-full border rounded-lg px-3 py-2"
            :placeholder="t('library.authorLastNamePlaceholder')"
          />
        </div>

        <div>
          <label class="block text-sm mb-1">{{ t('library.authorFirstName') }}</label>
          <input
            v-model="form.authorFirstName"
            required
            class="w-full border rounded-lg px-3 py-2"
            :placeholder="t('library.authorFirstNamePlaceholder')"
          />
        </div>

        <div class="sm:col-span-2">
          <label class="block text-sm mb-1">
            {{ isArticle ? t('library.articleTitle') : t('library.sourceTitle') }}
          </label>
          <input v-model="form.title" required class="w-full border rounded-lg px-3 py-2" />
        </div>

        <template v-if="isArticle">
          <div class="sm:col-span-2">
            <label class="block text-sm mb-1">{{ t('library.journal') }}</label>
            <input v-model="form.publisher" required class="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm mb-1">{{ t('library.volume') }}</label>
            <input v-model="form.volume" required class="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm mb-1">{{ t('library.issue') }}</label>
            <input v-model="form.issue" required class="w-full border rounded-lg px-3 py-2" />
          </div>
        </template>

        <template v-else>
          <div class="sm:col-span-2">
            <label class="block text-sm mb-1">{{ t('library.publisher') }}</label>
            <input
              v-model="form.publisher"
              :required="isBook"
              class="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </template>

        <div>
          <label class="block text-sm mb-1">{{ t('library.publicationPlace') }}</label>
          <input
            v-model="form.publicationPlace"
            :required="isBook"
            class="w-full border rounded-lg px-3 py-2"
            :placeholder="t('library.publicationPlacePlaceholder')"
          />
        </div>
        <div>
          <label class="block text-sm mb-1">{{ t('library.year') }}</label>
          <input
            v-model.number="form.publicationYear"
            type="number"
            :required="isBook || isArticle"
            class="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label class="block text-sm mb-1">{{ t('library.pageRange') }}</label>
          <input
            v-model="form.pages"
            :required="isArticle"
            class="w-full border rounded-lg px-3 py-2"
            placeholder="112-118"
          />
        </div>
      </div>

      <p v-if="usesMlaFields" class="text-xs text-slate-500">{{ t('library.mlaHint') }}</p>

      <div v-if="mlaPreview" class="text-sm bg-slate-50 border border-slate-200 rounded-lg p-3">
        <p class="text-xs text-slate-500 mb-1">{{ t('library.mlaPreview') }}</p>
        <p class="text-slate-700 italic">{{ mlaPreview }}</p>
      </div>

      <div class="flex gap-2">
        <button
          type="submit"
          :disabled="saving"
          class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {{ saving ? t('common.loading') : isEditing ? t('library.update') : t('library.save') }}
        </button>
        <button type="button" class="px-4 py-2 border rounded-lg" @click="closeForm">
          {{ t('common.cancel') }}
        </button>
      </div>
    </form>

    <p v-if="loading && sources.length === 0" class="text-slate-500">{{ t('common.loading') }}</p>
    <p v-else-if="sources.length === 0" class="text-slate-500">{{ emptyMessage }}</p>

    <template v-else>
      <p class="text-sm text-slate-500 mb-3">
        {{ t('library.resultsSummary', { from: showingFrom, to: showingTo, total: pagination.total }) }}
      </p>

      <ul
        :key="page"
        class="space-y-3 relative transition-opacity"
        :class="{ 'opacity-60': pageLoading }"
      >
        <li
          v-for="source in sources"
          :key="source.id"
          class="bg-white rounded-xl shadow-page p-4 border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div class="min-w-0 w-full sm:flex-1 overflow-hidden">
            <p class="font-medium truncate">{{ source.title }}</p>
            <p class="text-sm text-slate-500">
              {{ t(`library.types.${source.sourceType}`) }}
              <span v-if="sourceDisplayAuthor(source)"> · {{ sourceDisplayAuthor(source) }}</span>
              <span v-if="source.hasPdf" class="text-emerald-700"> · PDF</span>
            </p>
            <p
              v-if="source.sourceType === 'book' || source.sourceType === 'article'"
              class="hidden sm:block text-sm text-slate-600 mt-1 italic"
            >
              {{ formatMlaBibliography(source) }}
            </p>
          </div>
          <div class="relative z-10 flex flex-wrap items-center gap-3 w-full sm:w-auto sm:shrink-0">
            <button
              v-if="source.hasPdf"
              type="button"
              class="text-sm text-emerald-700 hover:underline"
              @click="openPdfViewer(source)"
            >
              {{ t('library.viewPdf') }}
            </button>
            <button
              type="button"
              class="text-sm text-indigo-600 hover:underline"
              @click="openEditForm(source)"
            >
              {{ t('library.edit') }}
            </button>
            <button
              type="button"
              class="text-sm text-indigo-600 hover:underline"
              @click="openPdfUpload(source.id)"
            >
              {{ source.hasPdf ? t('library.replacePdf') : t('library.upload') }}
            </button>
          </div>
        </li>
      </ul>

      <input
        ref="pdfUploadInput"
        type="file"
        accept="application/pdf"
        class="hidden"
        @change="onPdfUploadSelected"
      />

      <div
        v-if="pagination.totalPages > 1"
        class="flex flex-wrap items-center justify-center gap-2 mt-6"
      >
        <button
          type="button"
          class="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40"
          :disabled="page <= 1"
          @click="goToPage(page - 1)"
        >
          {{ t('library.prevPage') }}
        </button>
        <button
          v-for="n in pageNumbers"
          :key="n"
          type="button"
          class="px-3 py-1.5 text-sm border rounded-lg min-w-[2.25rem]"
          :class="n === page ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-slate-50'"
          @click="goToPage(n)"
        >
          {{ n }}
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40"
          :disabled="page >= pagination.totalPages"
          @click="goToPage(page + 1)"
        >
          {{ t('library.nextPage') }}
        </button>
      </div>
    </template>

    <LibraryPdfModal
      v-if="pdfViewer.sourceId"
      :source-id="pdfViewer.sourceId"
      :source-title="pdfViewer.title"
      @close="closePdfViewer"
    />
  </div>
</template>
