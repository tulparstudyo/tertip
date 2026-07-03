<script setup>
import { ref, watch, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '@/api/client';

const props = defineProps({
  sourceId: { type: Number, default: null },
  sourceTitle: { type: String, default: '' },
});

const emit = defineEmits(['close']);

const { t } = useI18n();
const loading = ref(false);
const error = ref('');
const streamUrl = ref('');

async function loadStream() {
  if (!props.sourceId) return;

  loading.value = true;
  error.value = '';
  streamUrl.value = '';

  try {
    const res = await api(`/user/library/sources/${props.sourceId}/stream-token`, {
      method: 'POST',
      silent: true,
    });
    const path = res.data?.streamUrl;
    if (!path) {
      error.value = t('library.pdfError');
      return;
    }
    const base = import.meta.env.VITE_API_URL ?? '/api/v1';
    streamUrl.value = `${base}${path}`;
  } catch {
    error.value = t('library.pdfError');
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.sourceId,
  (id) => {
    if (id) void loadStream();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  streamUrl.value = '';
});
</script>

<template>
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-xl w-full max-w-5xl h-[85vh] flex flex-col shadow-xl overflow-hidden">
      <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 shrink-0">
        <h3 class="font-semibold truncate">{{ sourceTitle || t('library.viewPdf') }}</h3>
        <button
          type="button"
          class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 shrink-0"
          @click="emit('close')"
        >
          {{ t('common.cancel') }}
        </button>
      </div>

      <div class="flex-1 min-h-0 bg-slate-100 relative">
        <p v-if="loading" class="absolute inset-0 flex items-center justify-center text-slate-500">
          {{ t('common.loading') }}
        </p>
        <p v-else-if="error" class="absolute inset-0 flex items-center justify-center text-red-600 px-4 text-center">
          {{ error }}
        </p>
        <iframe
          v-else-if="streamUrl"
          :src="streamUrl"
          class="w-full h-full border-0 bg-white"
          :title="sourceTitle"
        />
      </div>
    </div>
  </div>
</template>
