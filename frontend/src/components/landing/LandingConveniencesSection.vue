<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { IconChevronDown } from '@tabler/icons-vue';
import { resolveConvenienceIcon, convenienceIconColor } from '@/utils/convenience-icons.js';
import LandingConvenienceDetail from '@/components/landing/LandingConvenienceDetail.vue';

defineProps({
  section: {
    type: Object,
    required: true,
  },
});

const { t } = useI18n();
const expandedId = ref(null);

function toggleItem(id) {
  expandedId.value = expandedId.value === id ? null : id;
}

function isExpanded(id) {
  return expandedId.value === id;
}
</script>

<template>
  <section id="conveniences" class="py-20 bg-white">
    <div class="max-w-3xl mx-auto px-4">
      <div class="text-center mb-10 sm:mb-14">
        <h2 class="text-3xl sm:text-4xl font-bold text-slate-900">
          {{ section.title || t('landing.conveniences.title') }}
        </h2>
        <p class="mt-3 text-slate-600 max-w-2xl mx-auto">
          {{ section.subtitle || t('landing.conveniences.subtitle') }}
        </p>
      </div>

      <div class="space-y-2" :aria-label="t('landing.conveniences.listLabel')">
        <div
          v-for="item in section.items"
          :key="item.id"
          class="rounded-xl border overflow-hidden transition-colors"
          :class="isExpanded(item.id)
            ? 'border-indigo-300 bg-indigo-50/40 shadow-sm'
            : 'border-slate-200 bg-white'"
        >
          <button
            type="button"
            class="w-full flex items-center gap-3 text-left px-4 py-3.5 sm:px-5 sm:py-4"
            :aria-expanded="isExpanded(item.id)"
            @click="toggleItem(item.id)"
          >
            <component
              :is="resolveConvenienceIcon(item)"
              class="w-5 h-5 sm:w-6 sm:h-6 shrink-0"
              :class="convenienceIconColor(item, isExpanded(item.id), 'mobile')"
              aria-hidden="true"
            />
            <span
              class="flex-1 text-sm sm:text-base font-medium leading-snug"
              :class="isExpanded(item.id) ? 'text-indigo-900' : 'text-slate-800'"
            >
              {{ item.title }}
            </span>
            <IconChevronDown
              class="w-5 h-5 shrink-0 text-slate-400 transition-transform duration-300 ease-out"
              :class="{ 'rotate-180 text-indigo-600': isExpanded(item.id) }"
              aria-hidden="true"
            />
          </button>

          <div
            class="grid transition-[grid-template-rows] duration-300 ease-out"
            :class="isExpanded(item.id) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
          >
            <div class="overflow-hidden">
              <div
                class="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t border-slate-200/80 transition-opacity duration-300"
                :class="isExpanded(item.id) ? 'opacity-100' : 'opacity-0'"
              >
                <LandingConvenienceDetail :item="item" compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
