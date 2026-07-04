<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { IconPlayerPlay } from '@tabler/icons-vue';

const props = defineProps({
  item: { type: Object, required: true },
  compact: { type: Boolean, default: false },
});

const { t } = useI18n();

function toEmbedUrl(url) {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  const youtubeMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  if (trimmed.includes('youtube.com/embed/')) return trimmed;
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(trimmed)) return trimmed;
  return null;
}

const embedUrl = computed(() => toEmbedUrl(props.item?.videoUrl));
const isDirectVideo = computed(() => {
  const url = props.item?.videoUrl?.trim() ?? '';
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
});
</script>

<template>
  <div :class="compact ? 'space-y-4' : 'space-y-6'">
    <p class="text-slate-600 leading-relaxed text-sm sm:text-base">
      {{ item.description }}
    </p>

    <div
      v-if="embedUrl && !isDirectVideo"
      class="aspect-video rounded-xl overflow-hidden bg-slate-900 shadow-lg"
    >
      <iframe
        :src="embedUrl"
        :title="item.title"
        class="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      />
    </div>
    <div
      v-else-if="embedUrl && isDirectVideo"
      class="aspect-video rounded-xl overflow-hidden bg-slate-900 shadow-lg"
    >
      <video
        :key="item.id"
        :src="embedUrl"
        controls
        class="w-full h-full object-contain"
        preload="metadata"
      >
        {{ t('landing.conveniences.videoUnsupported') }}
      </video>
    </div>
    <div
      v-else
      class="aspect-video rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400"
    >
      <IconPlayerPlay class="w-10 h-10 mb-2 opacity-50" aria-hidden="true" />
      <p class="text-sm">{{ t('landing.conveniences.videoPlaceholder') }}</p>
    </div>
  </div>
</template>
