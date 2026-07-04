<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '@/api/client';
import { useNavAutoHide } from '@/composables/useNavAutoHide.js';

const emit = defineEmits(['comment-changed']);

const props = defineProps({
  projectId: { type: Number, required: true },
  section: { type: String, default: 'body' },
  isOwner: { type: Boolean, default: false },
  visibleFromLine: { type: Number, default: 1 },
  visibleToLine: { type: Number, default: 1 },
});

const { t } = useI18n();
const { navHidden } = useNavAutoHide();
const comments = ref([]);
const loading = ref(true);

const unresolvedCount = computed(() => comments.value.filter((c) => !c.isResolved).length);
const resolvedCount = computed(() => comments.value.filter((c) => c.isResolved).length);

const visibleComments = computed(() =>
  comments.value
    .filter(
      (c) =>
        c.lineNumber >= props.visibleFromLine && c.lineNumber <= props.visibleToLine,
    )
    .sort(
      (a, b) =>
        a.lineNumber - b.lineNumber
        || (a.columnOffset ?? 0) - (b.columnOffset ?? 0)
        || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
);

async function loadComments() {
  loading.value = true;
  try {
    const query = props.section ? `?section=${encodeURIComponent(props.section)}` : '';
    const res = await api(`/user/projects/${props.projectId}/comments${query}`);
    comments.value = res.data ?? [];
  } finally {
    loading.value = false;
  }
}

async function resolveComment(id) {
  await api(`/user/projects/${props.projectId}/comments/${id}/resolve`, {
    method: 'PATCH',
  });
  emit('comment-changed');
  await loadComments();
}

function formatCommentDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('tr-TR');
}

onMounted(loadComments);
watch(() => [props.projectId, props.section], loadComments);

defineExpose({ loadComments });
</script>

<template>
  <section
    class="comment-sidebar w-full bg-white rounded-xl shadow-page border border-slate-100 p-4 lg:sticky lg:self-start lg:flex lg:flex-col lg:max-h-[calc(100vh-5rem)] lg:transition-[top] lg:duration-300 lg:ease-in-out"
    :class="navHidden ? 'lg:top-4' : 'lg:top-20'"
  >
    <h2 class="text-sm font-semibold mb-2 shrink-0">{{ t('comments.title') }}</h2>

    <div
      v-if="!loading && comments.length > 0"
      class="flex flex-wrap gap-2 mb-3 shrink-0 text-xs"
    >
      <span class="inline-flex items-center rounded-full bg-amber-50 text-amber-800 px-2.5 py-1 font-medium">
        {{ t('comments.unresolvedCount', { count: unresolvedCount }) }}
      </span>
      <span class="inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 px-2.5 py-1 font-medium">
        {{ t('comments.resolvedCount', { count: resolvedCount }) }}
      </span>
    </div>

    <p class="text-xs text-slate-500 mb-3 shrink-0">
      {{ t('comments.visibleRange', { from: visibleFromLine, to: visibleToLine }) }}
    </p>

    <p v-if="loading" class="text-sm text-slate-500 shrink-0">{{ t('common.loading') }}</p>

    <p v-else-if="comments.length === 0" class="text-sm text-slate-500 shrink-0">
      {{ t('comments.empty') }}
    </p>

    <p v-else-if="visibleComments.length === 0" class="text-sm text-slate-500 shrink-0">
      {{ t('comments.emptyVisible') }}
    </p>

    <ul v-else class="comment-sidebar-list space-y-3 flex-1 min-h-0 overflow-y-auto">
      <li
        v-for="c in visibleComments"
        :key="c.id"
        class="text-sm rounded-lg p-2"
        :class="
          c.isResolved
            ? 'bg-emerald-50/60'
            : 'bg-amber-50/60'
        "
      >
        <p
          class="font-medium"
          :class="c.isResolved ? 'text-emerald-800' : 'text-amber-800'"
        >
          {{ c.userName }}
        </p>
        <p
          class="text-xs"
          :class="c.isResolved ? 'text-emerald-600' : 'text-amber-600'"
        >
          {{ formatCommentDate(c.createdAt) }}
        </p>
        <p
          class="mt-1"
          :class="c.isResolved ? 'text-emerald-900' : 'text-amber-900'"
        >
          {{ c.commentText }}
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
  </section>
</template>
