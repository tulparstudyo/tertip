<script setup>
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '@/api/client';

const props = defineProps({
  projectId: { type: Number, required: true },
  isOwner: { type: Boolean, default: false },
});

const emit = defineEmits(['refresh']);

const { t } = useI18n();
const comments = ref([]);
const loading = ref(true);
const newComment = ref('');

async function loadComments() {
  loading.value = true;
  try {
    const res = await api(`/user/projects/${props.projectId}/comments`);
    comments.value = res.data ?? [];
  } finally {
    loading.value = false;
  }
}

async function submitComment() {
  if (!newComment.value.trim()) return;

  const lineNumber = 1;
  const columnOffset = 0;

  await api(`/user/projects/${props.projectId}/comments`, {
    method: 'POST',
    body: {
      commentText: newComment.value.trim(),
      lineNumber,
      columnOffset,
    },
  });

  newComment.value = '';
  await loadComments();
  emit('refresh');
}

async function resolveComment(id) {
  await api(`/user/projects/${props.projectId}/comments/${id}/resolve`, {
    method: 'PATCH',
  });
  await loadComments();
}

onMounted(loadComments);
watch(() => props.projectId, loadComments);
</script>

<template>
  <section class="w-full bg-white rounded-xl shadow-page border border-slate-100 p-4">
    <h2 class="text-sm font-semibold mb-3">{{ t('comments.title') }}</h2>

    <p v-if="loading" class="text-sm text-slate-500">{{ t('common.loading') }}</p>

    <ul v-else class="space-y-3 mb-4 max-h-64 overflow-y-auto">
      <li
        v-for="c in comments"
        :key="c.id"
        class="text-sm border-b border-slate-100 pb-2"
        :class="{ 'opacity-50': c.isResolved }"
      >
        <p class="font-medium text-slate-700">{{ c.userName }}</p>
        <p class="text-slate-600">{{ c.commentText }}</p>
        <p class="text-xs text-slate-400 mt-1">
          {{ t('comments.matrix', { line: c.lineNumber, col: c.columnOffset }) }}
        </p>
        <button
          v-if="isOwner && !c.isResolved"
          type="button"
          class="text-xs text-indigo-600 mt-1 hover:underline"
          @click="resolveComment(c.id)"
        >
          {{ t('comments.resolve') }}
        </button>
      </li>
    </ul>

    <form class="space-y-2" @submit.prevent="submitComment">
      <textarea
        v-model="newComment"
        rows="3"
        class="w-full border rounded-lg px-2 py-1 text-sm"
        :placeholder="t('comments.placeholder')"
      />
      <button
        type="submit"
        class="w-full bg-indigo-600 text-white text-sm py-2 rounded-lg hover:bg-indigo-700"
      >
        {{ t('comments.submit') }}
      </button>
    </form>
  </section>
</template>
