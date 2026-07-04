<script setup>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PROJECT_SECTION_SLUGS } from '@/config/project-sections.js';

const props = defineProps({
  projectId: { type: Number, required: true },
});

const { t } = useI18n();
const route = useRoute();

const currentSection = computed(() => route.params.section ?? 'body');

function sectionTo(projectId, section) {
  return { name: 'project-editor', params: { projectId, section } };
}
</script>

<template>
  <nav class="w-full">
    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
      {{ t('editor.sections.title') }}
    </p>
    <ul class="space-y-1">
      <li v-for="section in PROJECT_SECTION_SLUGS" :key="section">
        <RouterLink
          :to="sectionTo(props.projectId, section)"
          class="block px-3 py-2 rounded-lg text-sm transition-colors"
          :class="
            currentSection === section
              ? 'bg-indigo-100 text-indigo-800 font-medium'
              : 'text-slate-600 hover:bg-slate-100'
          "
        >
          {{ t(`editor.sections.${section}`) }}
        </RouterLink>
      </li>
    </ul>
    <RouterLink
      :to="{ name: 'library', query: { projectId: props.projectId } }"
      class="mt-4 block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
    >
      {{ t('nav.library') }}
    </RouterLink>
  </nav>
</template>
