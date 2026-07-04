<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { adminApi } from '@/api/admin-client';

const { t } = useI18n();

const loading = ref(true);
const saving = ref(false);
const content = ref(null);
const jsonText = ref('');
const jsonError = ref('');

async function loadContent() {
  loading.value = true;
  try {
    const res = await adminApi('/landing', { silent: true });
    content.value = res.data?.content ?? {};
    jsonText.value = JSON.stringify(content.value, null, 2);
    jsonError.value = '';
  } finally {
    loading.value = false;
  }
}

function parseJson() {
  try {
    const parsed = JSON.parse(jsonText.value);
    jsonError.value = '';
    return parsed;
  } catch {
    jsonError.value = t('admin.landing.jsonError');
    return null;
  }
}

async function handleSave() {
  const parsed = parseJson();
  if (!parsed) return;

  saving.value = true;
  try {
    const res = await adminApi('/landing', {
      method: 'PUT',
      body: { content: parsed },
      notify: true,
    });
    content.value = res.data?.content ?? parsed;
    jsonText.value = JSON.stringify(content.value, null, 2);
  } finally {
    saving.value = false;
  }
}

onMounted(loadContent);
</script>

<template>
  <div class="space-y-4">
    <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
      {{ t('admin.landing.hint') }}
    </div>

    <div v-if="loading" class="p-8 text-center text-slate-500">{{ t('common.loading') }}</div>

    <template v-else>
      <div class="grid lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 class="font-semibold text-slate-800">{{ t('admin.landing.hero') }}</h3>
          <div v-if="content?.hero" class="space-y-3 text-sm">
            <div>
              <label class="block text-slate-500 mb-1">{{ t('admin.landing.heroEyebrow') }}</label>
              <input v-model="content.hero.eyebrow" class="w-full border rounded-lg px-3 py-2" @input="jsonText = JSON.stringify(content, null, 2)" />
            </div>
            <div>
              <label class="block text-slate-500 mb-1">{{ t('admin.landing.heroTitle') }}</label>
              <input v-model="content.hero.title" class="w-full border rounded-lg px-3 py-2" @input="jsonText = JSON.stringify(content, null, 2)" />
            </div>
            <div>
              <label class="block text-slate-500 mb-1">{{ t('admin.landing.heroSubtitle') }}</label>
              <textarea v-model="content.hero.subtitle" rows="3" class="w-full border rounded-lg px-3 py-2" @input="jsonText = JSON.stringify(content, null, 2)" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-500 mb-1">{{ t('admin.landing.ctaText') }}</label>
                <input v-model="content.hero.ctaText" class="w-full border rounded-lg px-3 py-2" @input="jsonText = JSON.stringify(content, null, 2)" />
              </div>
              <div>
                <label class="block text-slate-500 mb-1">{{ t('admin.landing.ctaLink') }}</label>
                <input v-model="content.hero.ctaLink" class="w-full border rounded-lg px-3 py-2" @input="jsonText = JSON.stringify(content, null, 2)" />
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 class="font-semibold text-slate-800">{{ t('admin.landing.bankInfo') }}</h3>
          <div v-if="content?.bankInfo" class="space-y-3 text-sm">
            <div>
              <label class="block text-slate-500 mb-1">{{ t('admin.landing.bankName') }}</label>
              <input v-model="content.bankInfo.bankName" class="w-full border rounded-lg px-3 py-2" @input="jsonText = JSON.stringify(content, null, 2)" />
            </div>
            <div>
              <label class="block text-slate-500 mb-1">{{ t('admin.landing.accountHolder') }}</label>
              <input v-model="content.bankInfo.accountHolder" class="w-full border rounded-lg px-3 py-2" @input="jsonText = JSON.stringify(content, null, 2)" />
            </div>
            <div>
              <label class="block text-slate-500 mb-1">IBAN</label>
              <input v-model="content.bankInfo.iban" class="w-full border rounded-lg px-3 py-2" @input="jsonText = JSON.stringify(content, null, 2)" />
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-slate-800">{{ t('admin.landing.jsonEditor') }}</h3>
          <button
            type="button"
            :disabled="saving"
            class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
            @click="handleSave"
          >
            {{ saving ? t('common.loading') : t('common.save') }}
          </button>
        </div>
        <p v-if="jsonError" class="text-red-600 text-sm mb-2">{{ jsonError }}</p>
        <textarea
          v-model="jsonText"
          rows="20"
          class="w-full font-mono text-xs border rounded-lg px-3 py-2 bg-slate-50"
          spellcheck="false"
        />
      </div>
    </template>
  </div>
</template>
