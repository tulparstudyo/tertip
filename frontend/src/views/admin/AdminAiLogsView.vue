<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { adminApi } from '@/api/admin-client';

const { t } = useI18n();

const items = ref([]);
const commandTypes = ref([]);
const loading = ref(true);
const page = ref(1);
const pagination = ref({ total: 0, totalPages: 1, limit: 20 });
const searchQuery = ref('');
const filterCommandType = ref('');
const filterStatus = ref('');
const filterDateFrom = ref('');
const filterDateTo = ref('');
const filterUserId = ref('');
const filterProjectId = ref('');
const detailLoading = ref(false);
const selectedLog = ref(null);
const showDetail = ref(false);

const hasFilters = computed(
  () => filterCommandType.value || filterStatus.value || filterDateFrom.value
    || filterDateTo.value || filterUserId.value || filterProjectId.value || searchQuery.value,
);

async function loadCommandTypes() {
  const res = await adminApi('/ai-logs/command-types', { silent: true });
  commandTypes.value = res.data?.commandTypes ?? [];
}

async function loadItems() {
  loading.value = true;
  try {
    const res = await adminApi('/ai-logs', {
      silent: true,
      query: {
        page: page.value,
        limit: pagination.value.limit,
        q: searchQuery.value.trim() || undefined,
        commandType: filterCommandType.value || undefined,
        status: filterStatus.value || undefined,
        dateFrom: filterDateFrom.value || undefined,
        dateTo: filterDateTo.value || undefined,
        userId: filterUserId.value.trim() || undefined,
        projectId: filterProjectId.value.trim() || undefined,
      },
    });
    items.value = res.data?.items ?? [];
    pagination.value = res.data?.pagination ?? { total: 0, totalPages: 1, limit: 20 };
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  page.value = 1;
  loadItems();
}

function clearFilters() {
  searchQuery.value = '';
  filterCommandType.value = '';
  filterStatus.value = '';
  filterDateFrom.value = '';
  filterDateTo.value = '';
  filterUserId.value = '';
  filterProjectId.value = '';
  page.value = 1;
  loadItems();
}

function goToPage(nextPage) {
  if (nextPage < 1 || nextPage > pagination.value.totalPages) return;
  page.value = nextPage;
  loadItems();
}

async function openDetail(item) {
  showDetail.value = true;
  detailLoading.value = true;
  selectedLog.value = item;
  try {
    const res = await adminApi(`/ai-logs/${item.id}`, { silent: true });
    selectedLog.value = res.data ?? item;
  } finally {
    detailLoading.value = false;
  }
}

function closeDetail() {
  showDetail.value = false;
  selectedLog.value = null;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('tr-TR');
}

function commandTypeLabel(type) {
  const key = `admin.aiLogs.commandType.${type}`;
  const translated = t(key);
  return translated !== key ? translated : type;
}

function statusClass(status) {
  return status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
}

function statusLabel(status) {
  return t(`admin.aiLogs.status.${status}`);
}

onMounted(async () => {
  await loadCommandTypes();
  await loadItems();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-3">
      <input
        v-model="searchQuery"
        type="search"
        :placeholder="t('admin.aiLogs.searchUser')"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm w-52"
        @keyup.enter="applyFilters"
      />
      <input
        v-model="filterUserId"
        type="number"
        min="1"
        :placeholder="t('admin.aiLogs.userId')"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm w-28"
        @keyup.enter="applyFilters"
      />
      <input
        v-model="filterProjectId"
        type="number"
        min="1"
        :placeholder="t('admin.aiLogs.projectId')"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm w-28"
        @keyup.enter="applyFilters"
      />
      <select v-model="filterCommandType" class="border rounded-lg px-3 py-2 text-sm" @change="applyFilters">
        <option value="">{{ t('admin.aiLogs.allCommandTypes') }}</option>
        <option v-for="type in commandTypes" :key="type" :value="type">
          {{ commandTypeLabel(type) }}
        </option>
      </select>
      <select v-model="filterStatus" class="border rounded-lg px-3 py-2 text-sm" @change="applyFilters">
        <option value="">{{ t('admin.allStatuses') }}</option>
        <option value="success">{{ t('admin.aiLogs.status.success') }}</option>
        <option value="failure">{{ t('admin.aiLogs.status.failure') }}</option>
      </select>
      <input
        v-model="filterDateFrom"
        type="date"
        class="border rounded-lg px-3 py-2 text-sm"
        @change="applyFilters"
      />
      <input
        v-model="filterDateTo"
        type="date"
        class="border rounded-lg px-3 py-2 text-sm"
        @change="applyFilters"
      />
      <button
        type="button"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
        @click="applyFilters"
      >
        {{ t('admin.aiLogs.filter') }}
      </button>
      <button
        v-if="hasFilters"
        type="button"
        class="px-4 py-2 rounded-lg border text-sm"
        @click="clearFilters"
      >
        {{ t('admin.aiLogs.clearFilters') }}
      </button>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-slate-500">{{ t('common.loading') }}</div>
      <table v-else class="w-full text-sm">
        <thead class="bg-slate-50 border-b">
          <tr>
            <th class="text-left p-3 font-medium">{{ t('admin.aiLogs.date') }}</th>
            <th class="text-left p-3 font-medium">{{ t('admin.aiLogs.user') }}</th>
            <th class="text-left p-3 font-medium">{{ t('admin.aiLogs.project') }}</th>
            <th class="text-left p-3 font-medium">{{ t('admin.aiLogs.commandType') }}</th>
            <th class="text-left p-3 font-medium">{{ t('admin.aiLogs.tokens') }}</th>
            <th class="text-left p-3 font-medium">{{ t('admin.status') }}</th>
            <th class="text-right p-3 font-medium">{{ t('admin.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id" class="border-b last:border-0 hover:bg-slate-50">
            <td class="p-3 text-slate-600 whitespace-nowrap">{{ formatDate(item.createdAt) }}</td>
            <td class="p-3">
              <p class="font-medium">{{ item.userName }}</p>
              <p class="text-slate-500 text-xs">#{{ item.userId }} · {{ item.userEmail }}</p>
            </td>
            <td class="p-3 text-slate-600">
              <template v-if="item.projectId">
                <p>{{ item.projectTitle || '—' }}</p>
                <p class="text-xs text-slate-400">#{{ item.projectId }}</p>
              </template>
              <span v-else>—</span>
            </td>
            <td class="p-3 text-slate-600">{{ commandTypeLabel(item.commandType) }}</td>
            <td class="p-3 text-slate-600">{{ item.tokensUsed }}</td>
            <td class="p-3">
              <span
                class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                :class="statusClass(item.status)"
              >
                {{ statusLabel(item.status) }}
              </span>
            </td>
            <td class="p-3 text-right">
              <button type="button" class="text-indigo-600 hover:underline" @click="openDetail(item)">
                {{ t('admin.aiLogs.detail') }}
              </button>
            </td>
          </tr>
          <tr v-if="!items.length">
            <td colspan="7" class="p-8 text-center text-slate-500">{{ t('admin.empty') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="pagination.totalPages > 1"
      class="flex items-center justify-between text-sm text-slate-600"
    >
      <p>{{ t('admin.aiLogs.pageInfo', { page: pagination.page, totalPages: pagination.totalPages, total: pagination.total }) }}</p>
      <div class="flex gap-2">
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg border disabled:opacity-40"
          :disabled="page <= 1"
          @click="goToPage(page - 1)"
        >
          {{ t('admin.aiLogs.prev') }}
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg border disabled:opacity-40"
          :disabled="page >= pagination.totalPages"
          @click="goToPage(page + 1)"
        >
          {{ t('admin.aiLogs.next') }}
        </button>
      </div>
    </div>

    <div
      v-if="showDetail"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      @click.self="closeDetail"
    >
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between p-5 border-b">
          <h3 class="font-semibold text-slate-800">{{ t('admin.aiLogs.detailTitle') }}</h3>
          <button type="button" class="text-slate-400 hover:text-slate-600 text-xl leading-none" @click="closeDetail">
            ×
          </button>
        </div>
        <div v-if="detailLoading" class="p-8 text-center text-slate-500">{{ t('common.loading') }}</div>
        <dl v-else-if="selectedLog" class="p-5 space-y-3 text-sm">
          <div class="grid grid-cols-3 gap-2">
            <dt class="text-slate-500">{{ t('admin.aiLogs.logId') }}</dt>
            <dd class="col-span-2 font-medium">#{{ selectedLog.id }}</dd>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <dt class="text-slate-500">{{ t('admin.aiLogs.date') }}</dt>
            <dd class="col-span-2">{{ formatDate(selectedLog.createdAt) }}</dd>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <dt class="text-slate-500">{{ t('admin.aiLogs.user') }}</dt>
            <dd class="col-span-2">
              {{ selectedLog.userName }} (#{{ selectedLog.userId }})<br>
              <span class="text-slate-500">{{ selectedLog.userEmail }}</span>
            </dd>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <dt class="text-slate-500">{{ t('admin.aiLogs.project') }}</dt>
            <dd class="col-span-2">
              <template v-if="selectedLog.projectId">
                {{ selectedLog.projectTitle || '—' }} (#{{ selectedLog.projectId }})
              </template>
              <span v-else>—</span>
            </dd>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <dt class="text-slate-500">{{ t('admin.aiLogs.commandType') }}</dt>
            <dd class="col-span-2">{{ commandTypeLabel(selectedLog.commandType) }}</dd>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <dt class="text-slate-500">{{ t('admin.aiLogs.tokens') }}</dt>
            <dd class="col-span-2">{{ selectedLog.tokensUsed }}</dd>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <dt class="text-slate-500">{{ t('admin.status') }}</dt>
            <dd class="col-span-2">
              <span
                class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                :class="statusClass(selectedLog.status)"
              >
                {{ statusLabel(selectedLog.status) }}
              </span>
            </dd>
          </div>
          <div v-if="selectedLog.errorMessage" class="grid grid-cols-3 gap-2">
            <dt class="text-slate-500">{{ t('admin.aiLogs.error') }}</dt>
            <dd class="col-span-2 text-red-600 break-words">{{ selectedLog.errorMessage }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>
