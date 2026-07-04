<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { adminApi } from '@/api/admin-client';

const { t } = useI18n();

const loading = ref(true);
const saving = ref(false);
const items = ref([]);

const groupOrder = ['contact', 'payment', 'smtp', 'security'];

const sortedGroups = computed(() => {
  const groups = {};
  for (const item of items.value) {
    if (!groups[item.settingGroup]) {
      groups[item.settingGroup] = [];
    }
    groups[item.settingGroup].push(item);
  }
  return groupOrder
    .filter((key) => groups[key]?.length)
    .map((key) => ({ key, items: groups[key] }));
});

function isSecretField(code) {
  return code === 'SMTP_PASS';
}

function isBooleanField(code) {
  return code === 'SMTP_SECURE';
}

async function loadSettings() {
  loading.value = true;
  try {
    const res = await adminApi('/settings', { silent: true });
    items.value = res.data?.items ?? [];
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  saving.value = true;
  try {
    const res = await adminApi('/settings', {
      method: 'PUT',
      body: {
        settings: items.value.map(({ id, settingValue }) => ({ id, settingValue })),
      },
      notify: true,
    });
    items.value = res.data?.items ?? items.value;
  } finally {
    saving.value = false;
  }
}

onMounted(loadSettings);
</script>

<template>
  <div class="space-y-6 max-w-3xl">
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
      {{ t('admin.settings.hint') }}
    </div>

    <div v-if="loading" class="p-8 text-center text-slate-500">{{ t('common.loading') }}</div>

    <form v-else class="space-y-6" @submit.prevent="handleSave">
      <section
        v-for="group in sortedGroups"
        :key="group.key"
        class="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
      >
        <h3 class="font-semibold text-slate-800">
          {{ t(`admin.settings.groups.${group.key}`) }}
        </h3>

        <div
          v-for="item in group.items"
          :key="item.id"
          class="space-y-1"
        >
          <label class="block text-sm text-slate-600" :for="`setting-${item.id}`">
            {{ item.settingName }}
            <span class="text-slate-400 font-mono text-xs ml-2">[{{ item.settingCode }}]</span>
          </label>

          <select
            v-if="isBooleanField(item.settingCode)"
            :id="`setting-${item.id}`"
            v-model="item.settingValue"
            class="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="true">{{ t('admin.settings.booleanTrue') }}</option>
            <option value="false">{{ t('admin.settings.booleanFalse') }}</option>
          </select>

          <input
            v-else-if="isSecretField(item.settingCode)"
            :id="`setting-${item.id}`"
            v-model="item.settingValue"
            type="password"
            autocomplete="off"
            class="w-full border rounded-lg px-3 py-2 text-sm font-mono"
          />

          <input
            v-else-if="item.settingValue.length < 120"
            :id="`setting-${item.id}`"
            v-model="item.settingValue"
            type="text"
            class="w-full border rounded-lg px-3 py-2 text-sm font-mono"
          />

          <textarea
            v-else
            :id="`setting-${item.id}`"
            v-model="item.settingValue"
            rows="3"
            class="w-full border rounded-lg px-3 py-2 text-sm font-mono"
          />
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
