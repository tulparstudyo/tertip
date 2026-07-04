<script setup>
import { ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from '@/api/client';
import A4Editor from '@/components/editor/A4Editor.vue';
import CommentSidebar from '@/components/editor/CommentSidebar.vue';
import ProjectSectionNav from '@/components/editor/ProjectSectionNav.vue';
import {
  DEFAULT_PROJECT_SECTION,
  isValidProjectSection,
} from '@/config/project-sections.js';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const project = ref(null);
const documentContent = ref(null);
const canEdit = ref(true);
const loading = ref(true);
const loadFailed = ref(false);
const commentSidebarRef = ref(null);
const editorRef = ref(null);
const visibleLineRange = ref({ fromLine: 1, toLine: 1 });

const projectId = computed(() => Number(route.params.projectId));

const section = computed(() => {
  const slug = route.params.section ?? DEFAULT_PROJECT_SECTION;
  return isValidProjectSection(slug) ? slug : DEFAULT_PROJECT_SECTION;
});

const sectionLabel = computed(() => t(`editor.sections.${section.value}`));

async function loadSectionContent() {
  loading.value = true;
  loadFailed.value = false;
  try {
    const [projectRes, contentRes] = await Promise.all([
      api(`/user/projects/${projectId.value}`),
      api(`/user/projects/${projectId.value}/sections/${section.value}`),
    ]);
    project.value = projectRes.data;
    documentContent.value = contentRes.data?.content ?? null;
    canEdit.value = contentRes.data?.canEdit ?? true;
  } catch {
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.params.section,
  (slug) => {
    if (slug && !isValidProjectSection(slug)) {
      router.replace({
        name: 'project-editor',
        params: { projectId: projectId.value, section: DEFAULT_PROJECT_SECTION },
      });
    }
  },
  { immediate: true },
);

watch([projectId, section], loadSectionContent, { immediate: true });

function onCommentAdded() {
  commentSidebarRef.value?.loadComments();
  editorRef.value?.syncCommentMarkersFromApi?.();
}

function onCommentsUpdated() {
  commentSidebarRef.value?.loadComments({ silent: true });
}

function onVisibleLinesChange(range) {
  visibleLineRange.value = range;
}
</script>

<template>
  <div>
    <p v-if="loading" class="text-slate-500 mb-4">{{ t('common.loading') }}</p>
    <p v-else-if="loadFailed" class="text-red-600 mb-4">{{ t('common.error') }}</p>
    <div v-else-if="project" class="flex flex-col lg:flex-row gap-6">
      <div class="w-full lg:w-56 shrink-0 flex flex-col gap-4">
        <ProjectSectionNav :project-id="project.id" />
        <CommentSidebar
          ref="commentSidebarRef"
          :project-id="project.id"
          :section="section"
          :is-owner="project.isOwner"
          :visible-from-line="visibleLineRange.fromLine"
          :visible-to-line="visibleLineRange.toLine"
          @comment-changed="onCommentAdded"
        />
      </div>
      <A4Editor
        ref="editorRef"
        :key="`${project.id}-${section}`"
        :project-id="project.id"
        :title="project.title"
        :project-type="project.projectType"
        :section="section"
        :section-label="sectionLabel"
        :initial-content="documentContent"
        :can-edit="canEdit"
        @comment-added="onCommentAdded"
        @comments-updated="onCommentsUpdated"
        @visible-lines-change="onVisibleLinesChange"
      />
    </div>
  </div>
</template>
