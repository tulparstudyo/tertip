<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { IconPlayerPlay } from '@tabler/icons-vue';
import { resolveConvenienceCover } from '@/utils/convenience-covers.js';

const props = defineProps({
  item: { type: Object, required: true },
  compact: { type: Boolean, default: false },
});

const { t } = useI18n();
const coverImage = computed(() => resolveConvenienceCover(props.item));

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
      v-else-if="coverImage"
      class="relative aspect-video rounded-xl overflow-hidden bg-slate-100 shadow-lg group"
    >
      <img
        :src="coverImage"
        :alt="item.title"
        class="w-full h-full object-cover"
        loading="lazy"
      />
      <div class="absolute inset-0 bg-slate-900/20 flex flex-col items-center justify-center">
        <div class="w-14 h-14 rounded-full bg-white/90 shadow-md flex items-center justify-center">
          <IconPlayerPlay class="w-7 h-7 text-indigo-600 ml-0.5" aria-hidden="true" />
        </div>
        <p class="mt-3 text-sm font-medium text-white drop-shadow">{{ t('landing.conveniences.videoPlaceholder') }}</p>
      </div>
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
