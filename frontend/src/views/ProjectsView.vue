<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  IconFileText,
  IconBrandGoogleDrive,
  IconPencil,
  IconShare,
  IconTrash,
} from '@tabler/icons-vue';
import { api } from '@/api/client';
import { useAuth } from '@/composables/useAuth';
import { tablerIconProps } from '@/constants/icons.js';
import {
  createEmptyMetadata,
  getMetadataFields,
} from '@/config/project-metadata.js';

const { t } = useI18n();
const { user } = useAuth();

const actionIcon = tablerIconProps.toolbar;

const projects = ref([]);
const loading = ref(true);
const showForm = ref(false);
const saving = ref(false);
const editingProjectId = ref(null);
const refreshKapak = ref(true);
const showShareModal = ref(false);
const shareSaving = ref(false);
const shareEmail = ref('');
const shareTarget = ref(null);

const projectTypes = ['thesis', 'article', 'proceeding', 'book', 'proposal', 'other'];

const form = ref({
  title: '',
  projectType: 'article',
  metadata: {},
});

const isEditing = computed(() => editingProjectId.value !== null);
const metadataFields = computed(() => getMetadataFields(form.value.projectType));

function resetMetadata() {
  form.value.metadata = createEmptyMetadata(form.value.projectType, {
    title: form.value.title,
    authorName: user.value?.name ?? '',
  });
}

function mergeMetadata(projectType, existing = {}) {
  return {
    ...createEmptyMetadata(projectType, {
      title: form.value.title,
      authorName: user.value?.name ?? '',
    }),
    ...existing,
  };
}

watch(
  () => form.value.projectType,
  () => {
    if (!showForm.value) return;
    form.value.metadata = mergeMetadata(form.value.projectType, form.value.metadata);
  },
);

watch(
  () => form.value.title,
  (title) => {
    if (form.value.projectType === 'thesis' && 'thesisTitle' in form.value.metadata) {
      if (!isEditing.value || !form.value.metadata.thesisTitle) {
        form.value.metadata.thesisTitle = title;
      }
    }
  },
);

async function loadProjects() {
  loading.value = true;
  try {
    const res = await api('/user/projects');
    projects.value = res.data ?? [];
  } finally {
    loading.value = false;
  }
}

function closeForm() {
  showForm.value = false;
  editingProjectId.value = null;
  refreshKapak.value = true;
}

function openCreateForm() {
  editingProjectId.value = null;
  refreshKapak.value = true;
  showForm.value = true;
  form.value = { title: '', projectType: 'article', metadata: {} };
  resetMetadata();
}

function openEditForm(project) {
  editingProjectId.value = project.id;
  refreshKapak.value = true;
  showForm.value = true;
  form.value = {
    title: project.title,
    projectType: project.projectType,
    metadata: mergeMetadata(project.projectType, project.metadata ?? {}),
  };
}

async function submitProject() {
  saving.value = true;
  try {
    const body = {
      title: form.value.title,
      projectType: form.value.projectType,
      metadata: form.value.metadata,
      refreshKapak: refreshKapak.value,
    };

    if (isEditing.value) {
      await api(`/user/projects/${editingProjectId.value}`, {
        method: 'PUT',
        body,
      });
    } else {
      await api('/user/projects', { method: 'POST', body });
    }

    closeForm();
    form.value = { title: '', projectType: 'article', metadata: {} };
    resetMetadata();
    await loadProjects();
  } finally {
    saving.value = false;
  }
}

async function deleteProject(id) {
  if (!confirm(t('projects.deleteConfirm'))) return;
  await api(`/user/projects/${id}`, { method: 'DELETE' });
  await loadProjects();
}

function openShareModal(project) {
  shareTarget.value = project;
  shareEmail.value = '';
  showShareModal.value = true;
}

function closeShareModal() {
  showShareModal.value = false;
  shareTarget.value = null;
  shareEmail.value = '';
}

async function submitShare() {
  if (!shareTarget.value || !shareEmail.value.trim()) return;

  shareSaving.value = true;
  try {
    await api(`/user/projects/${shareTarget.value.id}/shares`, {
      method: 'POST',
      body: { email: shareEmail.value.trim() },
      notify: true,
    });
    closeShareModal();
  } finally {
    shareSaving.value = false;
  }
}

function googleDriveUrl(project) {
  if (project.googleDocsFileId) {
    return `https://drive.google.com/file/d/${project.googleDocsFileId}/view`;
  }
  if (project.googleDriveFolderId) {
    return `https://drive.google.com/drive/folders/${project.googleDriveFolderId}`;
  }
  return null;
}

onMounted(loadProjects);
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ t('projects.title') }}</h1>
      <button
        type="button"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        @click="openCreateForm"
      >
        {{ t('projects.create') }}
      </button>
    </div>

    <form
      v-if="showForm"
      class="bg-white rounded-xl shadow-page p-6 mb-6 border border-slate-100 grid sm:grid-cols-2 gap-4"
      @submit.prevent="submitProject"
    >
      <div class="sm:col-span-2">
        <h2 class="text-lg font-semibold">
          {{ isEditing ? t('projects.editTitle') : t('projects.create') }}
        </h2>
      </div>

      <div class="sm:col-span-2">
        <label class="block text-sm mb-1">{{ t('projects.projectTitle') }}</label>
        <input
          v-model="form.title"
          required
          class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          :placeholder="t('projects.titlePlaceholder')"
        />
      </div>

      <div class="sm:col-span-2">
        <label class="block text-sm mb-1">{{ t('projects.projectType') }}</label>
        <select v-model="form.projectType" class="w-full border rounded-lg px-3 py-2">
          <option v-for="type in projectTypes" :key="type" :value="type">
            {{ t(`projects.types.${type}`) }}
          </option>
        </select>
      </div>

      <template v-if="metadataFields.length">
        <div class="sm:col-span-2">
          <p class="text-sm font-medium text-slate-700">{{ t('projects.metadataTitle') }}</p>
          <p class="text-xs text-slate-500 mt-1">{{ t('projects.metadataHint') }}</p>
        </div>

        <div v-for="field in metadataFields" :key="field.key">
          <label class="block text-sm mb-1">
            {{ t(`projects.metadata.${field.key}`) }}
            <span v-if="field.required" class="text-red-500">*</span>
          </label>

          <select
            v-if="field.type === 'select'"
            v-model="form.metadata[field.key]"
            required
            class="w-full border border-slate-300 rounded-lg px-3 py-2"
          >
            <option value="" disabled>{{ t('projects.metadataSelect') }}</option>
            <option v-for="option in field.options" :key="option" :value="option">
              {{ option }}
            </option>
          </select>

          <input
            v-else
            v-model="form.metadata[field.key]"
            :required="field.required"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </template>

      <div v-if="isEditing" class="sm:col-span-2">
        <label class="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
          <input v-model="refreshKapak" type="checkbox" class="mt-1" />
          <span>
            {{ t('projects.refreshKapak') }}
            <span class="block text-xs text-slate-500">{{ t('projects.refreshKapakHint') }}</span>
          </span>
        </label>
      </div>

      <div class="sm:col-span-2 flex gap-3">
        <button
          type="submit"
          :disabled="saving"
          class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {{
            saving
              ? t('common.loading')
              : isEditing
                ? t('projects.editSubmit')
                : t('projects.createSubmit')
          }}
        </button>
        <button
          type="button"
          class="border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50"
          @click="closeForm"
        >
          {{ t('common.cancel') }}
        </button>
      </div>
      <p v-if="!isEditing" class="sm:col-span-2 text-sm text-slate-500">
        {{ t('projects.createHint') }}
      </p>
    </form>

    <p v-if="loading" class="text-slate-500">{{ t('common.loading') }}</p>
    <p v-else-if="projects.length === 0" class="text-slate-500">{{ t('projects.empty') }}</p>

    <ul v-else class="space-y-3">
      <li
        v-for="project in projects"
        :key="project.id"
        class="bg-white rounded-xl shadow-page p-4 border border-slate-100 flex flex-wrap items-center justify-between gap-3"
      >
        <div class="min-w-0 basis-full w-full sm:basis-auto sm:flex-1">
          <p class="font-medium block w-full">{{ project.title }}</p>
          <p class="text-sm text-slate-500">
            {{ t(`projects.types.${project.projectType}`) }}
            · {{ new Date(project.updatedAt).toLocaleDateString('tr-TR') }}
          </p>
        </div>
        <div class="flex items-center gap-1 basis-full w-full sm:basis-auto sm:w-auto sm:shrink-0">
          <RouterLink
            :to="{ name: 'project-editor', params: { projectId: project.id, section: 'body' } }"
            class="project-action-btn project-action-btn--primary"
            :title="t('projects.openEditor')"
            :aria-label="t('projects.openEditor')"
          >
            <IconFileText v-bind="actionIcon" aria-hidden="true" />
          </RouterLink>
          <a
            v-if="googleDriveUrl(project)"
            :href="googleDriveUrl(project)"
            target="_blank"
            rel="noopener noreferrer"
            class="project-action-btn project-action-btn--primary"
            :title="t('projects.openInDrive')"
            :aria-label="t('projects.openInDrive')"
          >
            <IconBrandGoogleDrive v-bind="actionIcon" aria-hidden="true" />
          </a>
          <button
            v-if="project.isOwner !== false"
            type="button"
            class="project-action-btn"
            :title="t('projects.edit')"
            :aria-label="t('projects.edit')"
            @click="openEditForm(project)"
          >
            <IconPencil v-bind="actionIcon" aria-hidden="true" />
          </button>
          <button
            v-if="project.isOwner !== false"
            type="button"
            class="project-action-btn"
            :title="t('projects.share')"
            :aria-label="t('projects.share')"
            @click="openShareModal(project)"
          >
            <IconShare v-bind="actionIcon" aria-hidden="true" />
          </button>
          <button
            v-if="project.isOwner !== false"
            type="button"
            class="project-action-btn project-action-btn--danger"
            :title="t('projects.delete')"
            :aria-label="t('projects.delete')"
            @click="deleteProject(project.id)"
          >
            <IconTrash v-bind="actionIcon" aria-hidden="true" />
          </button>
        </div>
      </li>
    </ul>

    <div
      v-if="showShareModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="closeShareModal"
    >
      <div class="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
        <h3 class="text-lg font-semibold">{{ t('projects.share') }}</h3>
        <p v-if="shareTarget" class="text-sm text-slate-600">
          {{ shareTarget.title }}
        </p>
        <div>
          <label class="block text-sm mb-1" for="share-email-input">
            {{ t('projects.sharePrompt') }}
          </label>
          <input
            id="share-email-input"
            v-model="shareEmail"
            type="email"
            required
            autocomplete="email"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            :placeholder="t('auth.email')"
            @keyup.enter="submitShare"
          />
        </div>
        <div class="flex gap-2 justify-end">
          <button
            type="button"
            class="px-4 py-2 border rounded-lg hover:bg-slate-50"
            :disabled="shareSaving"
            @click="closeShareModal"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            :disabled="shareSaving || !shareEmail.trim()"
            @click="submitShare"
          >
            {{ shareSaving ? t('common.loading') : t('projects.share') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-action-btn {
  @apply inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors;
}

.project-action-btn--primary {
  @apply text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700;
}

.project-action-btn--danger {
  @apply text-red-600 hover:bg-red-50 hover:text-red-700;
}
</style>
