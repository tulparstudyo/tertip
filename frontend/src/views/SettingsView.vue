<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from '@/api/client';
import { toast } from '@/composables/useToast';

const { t } = useI18n();
const route = useRoute();

const status = ref(null);
const loading = ref(true);
const actionLoading = ref(false);

async function loadStatus() {
  loading.value = true;
  try {
    const res = await api('/user/google/status', { silent: true });
    status.value = res.data;
  } catch {
    status.value = { connected: false, verified: false };
  } finally {
    loading.value = false;
  }
}

async function connectGoogle() {
  actionLoading.value = true;
  try {
    const res = await api('/user/google/connect-url');
    window.open(res.data.url, '_blank', 'noopener,noreferrer');
  } finally {
    actionLoading.value = false;
  }
}

async function disconnectGoogle() {
  actionLoading.value = true;
  try {
    await api('/user/google/disconnect', { method: 'DELETE' });
    await loadStatus();
  } finally {
    actionLoading.value = false;
  }
}

onMounted(() => {
  if (route.query.connected === '1') {
    toast.success(t('settings.google.success'));
    loadStatus();
    return;
  }
  loadStatus();
});
</script>

<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold mb-6">{{ t('settings.title') }}</h1>

    <div class="bg-white rounded-xl shadow-page p-6 border border-slate-100">
      <h2 class="font-semibold mb-4">{{ t('settings.google.title') }}</h2>

      <p v-if="loading" class="text-slate-500">{{ t('common.loading') }}</p>

      <template v-else>
        <p class="mb-4">
          <span
            class="inline-flex items-center px-2 py-1 rounded text-sm"
            :class="{
              'bg-green-100 text-green-800': status?.connected && status?.verified,
              'bg-amber-100 text-amber-900': status?.needsReconnect,
              'bg-slate-100 text-slate-600': !status?.connected && !status?.needsReconnect,
            }"
          >
            {{
              status?.connected && status?.verified
                ? t('settings.google.connected')
                : status?.needsReconnect
                  ? t('settings.google.unverified')
                  : t('settings.google.disconnected')
            }}
          </span>
        </p>

        <p v-if="status?.needsReconnect" class="text-sm text-amber-800 mb-4">
          {{
            status?.reason === 'NETWORK'
              ? t('settings.google.networkHint')
              : t('settings.google.reconnectHint')
          }}
        </p>

        <div class="flex flex-wrap gap-2">
          <button
            v-if="!status?.connected || status?.needsReconnect"
            type="button"
            :disabled="actionLoading"
            class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            @click="connectGoogle"
          >
            {{ status?.needsReconnect ? t('settings.google.reconnect') : t('settings.google.connect') }}
          </button>
          <button
            v-if="status?.connected || status?.needsReconnect"
            type="button"
            :disabled="actionLoading"
            class="border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
            @click="disconnectGoogle"
          >
            {{ t('settings.google.disconnect') }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
