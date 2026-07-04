<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { adminApi } from '@/api/admin-client';
import {
  THEME_COLOR_KEYS,
  THEME_ELEMENT_KEYS,
  THEME_ELEMENT_FIELDS,
  THEME_FIELD_TYPES,
  THEME_FONT_WEIGHT_OPTIONS,
  buildElementPreviewStyle,
  collectGoogleFontFamilies,
  ensureGoogleFontsPreconnect,
  loadGoogleFonts,
} from '@/config/theme-settings.js';
import { useThemeSettings } from '@/composables/useThemeSettings.js';

const { t } = useI18n();
const { applyThemePayload } = useThemeSettings();

const loading = ref(true);
const saving = ref(false);
const theme = ref(null);
const googleFonts = ref([]);

const globalGoogleFont = computed({
  get: () => theme.value?.typography?.googleFont ?? 'Inter',
  set: (value) => {
    if (!theme.value) return;
    if (!theme.value.typography) {
      theme.value.typography = { googleFont: value };
    } else {
      theme.value.typography.googleFont = value;
    }
  },
});

const activeElement = ref('body');

const colorKeys = THEME_COLOR_KEYS;
const elementKeys = THEME_ELEMENT_KEYS;

const activeFields = computed(
  () => THEME_ELEMENT_FIELDS[activeElement.value] ?? [],
);

const previewBodyStyle = computed(() =>
  buildElementPreviewStyle('body', theme.value?.elements?.body, globalGoogleFont.value));
const previewPStyle = computed(() =>
  buildElementPreviewStyle('p', theme.value?.elements?.p, globalGoogleFont.value));
const previewH1Style = computed(() =>
  buildElementPreviewStyle('h1', theme.value?.elements?.h1, globalGoogleFont.value));
const previewH2Style = computed(() =>
  buildElementPreviewStyle('h2', theme.value?.elements?.h2, globalGoogleFont.value));
const previewH3Style = computed(() =>
  buildElementPreviewStyle('h3', theme.value?.elements?.h3, globalGoogleFont.value));
const previewButtonStyle = computed(() =>
  buildElementPreviewStyle('button', theme.value?.elements?.button, globalGoogleFont.value));

function fieldType(field) {
  return THEME_FIELD_TYPES[field] ?? 'text';
}

function syncGoogleFonts() {
  if (!theme.value) return;
  loadGoogleFonts(collectGoogleFontFamilies(theme.value));
}

async function loadTheme() {
  loading.value = true;
  try {
    ensureGoogleFontsPreconnect();
    const res = await adminApi('/settings/theme-settings', { silent: true });
    theme.value = res.data?.theme ?? null;
    googleFonts.value = res.data?.fontOptions?.google ?? [];
    applyThemePayload(res.data);
    syncGoogleFonts();
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  if (!theme.value) return;
  saving.value = true;
  try {
    const res = await adminApi('/settings/theme-settings', {
      method: 'PUT',
      body: { theme: theme.value },
      notify: true,
    });
    theme.value = res.data?.theme ?? theme.value;
    applyThemePayload(res.data);
    syncGoogleFonts();
  } finally {
    saving.value = false;
  }
}

function applyColorSetPreset() {
  if (!theme.value) return;
  const { primary, text, textMuted, background, surface, border } = theme.value.colorSet;
  theme.value.elements.button.backgroundColor = primary;
  theme.value.elements.body.backgroundColor = background;
  theme.value.elements.body.color = text;
  theme.value.elements.p.color = textMuted || text;
  theme.value.elements.h1.color = text;
  theme.value.elements.h2.color = text;
  theme.value.elements.h3.color = text;
  theme.value.colorSet.surface = surface || background;
  theme.value.colorSet.border = border;
}

onMounted(loadTheme);

watch(
  () => theme.value?.typography?.googleFont,
  () => syncGoogleFonts(),
);
</script>

<template>
  <div class="space-y-6 max-w-5xl">
    <div class="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-violet-900">
      {{ t('admin.themeSettings.hint') }}
    </div>

    <div v-if="loading" class="p-8 text-center text-slate-500">{{ t('common.loading') }}</div>

    <form v-else-if="theme" class="space-y-6" @submit.prevent="handleSave">
      <!-- Color set -->
      <section class="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h3 class="font-semibold text-slate-800">{{ t('admin.themeSettings.colorSet') }}</h3>
          <button
            type="button"
            class="text-sm text-indigo-600 hover:text-indigo-800"
            @click="applyColorSetPreset"
          >
            {{ t('admin.themeSettings.applyColorSetToElements') }}
          </button>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="key in colorKeys" :key="key" class="space-y-1">
            <label class="block text-sm text-slate-600" :for="`color-${key}`">
              {{ t(`admin.themeSettings.colors.${key}`) }}
            </label>
            <div class="flex items-center gap-2">
              <input
                :id="`color-${key}`"
                v-model="theme.colorSet[key]"
                type="color"
                class="h-10 w-12 rounded border border-slate-200 cursor-pointer"
              />
              <input
                v-model="theme.colorSet[key]"
                type="text"
                class="flex-1 border rounded-lg px-3 py-2 text-sm font-mono uppercase"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Element typography -->
      <section class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 space-y-4">
          <h3 class="font-semibold text-slate-800">{{ t('admin.themeSettings.typography') }}</h3>
          <div class="max-w-md space-y-1">
            <label class="block text-sm text-slate-600" for="global-google-font">
              {{ t('admin.themeSettings.globalGoogleFont') }}
            </label>
            <select
              id="global-google-font"
              v-model="globalGoogleFont"
              class="w-full border rounded-lg px-3 py-2 text-sm"
              @change="syncGoogleFonts"
            >
              <option v-for="font in googleFonts" :key="font" :value="font">
                {{ font }}
              </option>
            </select>
            <p class="text-xs text-slate-500">{{ t('admin.themeSettings.globalGoogleFontHint') }}</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-1 p-3 border-b border-slate-100 bg-slate-50">
          <button
            v-for="key in elementKeys"
            :key="key"
            type="button"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            :class="activeElement === key
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'"
            @click="activeElement = key"
          >
            {{ t(`admin.themeSettings.elements.${key}`) }}
          </button>
        </div>

        <div class="p-6 grid md:grid-cols-2 gap-4">
          <div
            v-for="field in activeFields"
            :key="`${activeElement}-${field}`"
            class="space-y-1"
          >
            <label class="block text-sm text-slate-600" :for="`${activeElement}-${field}`">
              {{ t(`admin.themeSettings.fields.${field}`) }}
            </label>

            <select
              v-if="fieldType(field) === 'weight'"
              :id="`${activeElement}-${field}`"
              v-model="theme.elements[activeElement][field]"
              class="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">{{ t('admin.themeSettings.inheritDefault') }}</option>
              <option v-for="weight in THEME_FONT_WEIGHT_OPTIONS" :key="weight" :value="weight">
                {{ weight }}
              </option>
            </select>

            <div v-else-if="fieldType(field) === 'color'" class="flex items-center gap-2">
              <input
                :id="`${activeElement}-${field}`"
                v-model="theme.elements[activeElement][field]"
                type="color"
                class="h-10 w-12 rounded border border-slate-200 cursor-pointer"
              />
              <input
                v-model="theme.elements[activeElement][field]"
                type="text"
                class="flex-1 border rounded-lg px-3 py-2 text-sm font-mono uppercase"
                :placeholder="t('admin.themeSettings.colorPlaceholder')"
              />
            </div>

            <input
              v-else
              :id="`${activeElement}-${field}`"
              v-model="theme.elements[activeElement][field]"
              type="text"
              class="w-full border rounded-lg px-3 py-2 text-sm font-mono"
              :placeholder="t(`admin.themeSettings.placeholders.${field}`)"
            />
          </div>
        </div>
      </section>

      <!-- Preview -->
      <section class="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 class="font-semibold text-slate-800">{{ t('admin.themeSettings.preview') }}</h3>
        <div
          class="rounded-xl border border-slate-200 p-6 space-y-4"
          :style="previewBodyStyle"
        >
          <h1 :style="previewH1Style">{{ t('admin.themeSettings.previewH1') }}</h1>
          <h2 :style="previewH2Style">{{ t('admin.themeSettings.previewH2') }}</h2>
          <h3 :style="previewH3Style">{{ t('admin.themeSettings.previewH3') }}</h3>
          <p :style="previewPStyle">{{ t('admin.themeSettings.previewP') }}</p>
          <button type="button" class="inline-block border-0" :style="previewButtonStyle">
            {{ t('admin.themeSettings.previewButton') }}
          </button>
        </div>
      </section>

      <div class="flex justify-end">
        <button
          type="submit"
          class="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          :disabled="saving"
        >
          {{ saving ? t('common.loading') : t('common.save') }}
        </button>
      </div>
    </form>
  </div>
</template>
