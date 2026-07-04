<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { adminApi } from '@/api/admin-client';

const { t } = useI18n();

const items = ref([]);
const loading = ref(true);
const page = ref(1);
const searchQuery = ref('');
const filterStatus = ref('pending');
const reviewingId = ref(null);
const adminNotes = ref('');
const invoiceNumber = ref('');
const invoicePdfUrl = ref('');

async function loadItems() {
  loading.value = true;
  try {
    const res = await adminApi('/payments', {
      silent: true,
      query: {
        page: page.value,
        limit: 20,
        q: searchQuery.value.trim(),
        status: filterStatus.value || undefined,
      },
    });
    items.value = res.data?.items ?? [];
  } finally {
    loading.value = false;
  }
}

function openReview(item) {
  reviewingId.value = item.id;
  adminNotes.value = '';
  invoiceNumber.value = '';
  invoicePdfUrl.value = '';
}

function closeReview() {
  reviewingId.value = null;
  adminNotes.value = '';
  invoiceNumber.value = '';
  invoicePdfUrl.value = '';
}

async function handleReview(action) {
  const id = reviewingId.value;
  if (!id) return;

  const body = { adminNotes: adminNotes.value || undefined };
  if (action === 'approve') {
    body.invoiceNumber = invoiceNumber.value.trim() || undefined;
    body.invoicePdfUrl = invoicePdfUrl.value.trim() || undefined;
  }

  await adminApi(`/payments/${id}/${action}`, {
    method: 'POST',
    body,
    notify: true,
  });
  closeReview();
  await loadItems();
}

function formatAmount(amount, currency) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency || 'TRY' }).format(amount);
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('tr-TR');
}

function statusClass(status) {
  if (status === 'approved') return 'bg-green-100 text-green-700';
  if (status === 'rejected') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

function statusLabel(status) {
  return t(`admin.payments.status.${status}`);
}

onMounted(loadItems);
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-3">
      <input
        v-model="searchQuery"
        type="search"
        :placeholder="t('admin.search')"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64"
        @keyup.enter="page = 1; loadItems()"
      />
      <select v-model="filterStatus" class="border rounded-lg px-3 py-2 text-sm" @change="page = 1; loadItems()">
        <option value="">{{ t('admin.allStatuses') }}</option>
        <option value="pending">{{ t('admin.payments.status.pending') }}</option>
        <option value="approved">{{ t('admin.payments.status.approved') }}</option>
        <option value="rejected">{{ t('admin.payments.status.rejected') }}</option>
      </select>
    </div>

    <div v-if="reviewingId" class="bg-white rounded-xl border border-indigo-200 p-6 space-y-4">
      <h3 class="font-semibold text-slate-800">{{ t('admin.payments.review') }}</h3>
      <div>
        <label class="block text-sm font-medium mb-1">{{ t('admin.payments.adminNotes') }}</label>
        <textarea v-model="adminNotes" rows="3" class="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('admin.payments.invoiceNumber') }}</label>
          <input v-model="invoiceNumber" class="w-full border rounded-lg px-3 py-2 text-sm" />
          <p class="text-xs text-slate-400 mt-1">{{ t('admin.payments.invoiceHint') }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('admin.payments.invoicePdfUrl') }}</label>
          <input v-model="invoicePdfUrl" type="url" class="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
          @click="handleReview('approve')"
        >
          {{ t('admin.payments.approve') }}
        </button>
        <button
          type="button"
          class="bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
          @click="handleReview('reject')"
        >
          {{ t('admin.payments.reject') }}
        </button>
        <button type="button" class="px-4 py-2 rounded-lg border text-sm" @click="closeReview">
          {{ t('common.cancel') }}
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-slate-500">{{ t('common.loading') }}</div>
      <table v-else class="w-full text-sm">
        <thead class="bg-slate-50 border-b">
          <tr>
            <th class="text-left p-3 font-medium">{{ t('admin.payments.user') }}</th>
            <th class="text-left p-3 font-medium">{{ t('admin.payments.amount') }}</th>
            <th class="text-left p-3 font-medium">{{ t('admin.payments.reference') }}</th>
            <th class="text-left p-3 font-medium">{{ t('admin.payments.transferDate') }}</th>
            <th class="text-left p-3 font-medium">{{ t('admin.payments.invoiceNumber') }}</th>
            <th class="text-left p-3 font-medium">{{ t('admin.status') }}</th>
            <th class="text-right p-3 font-medium">{{ t('admin.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id" class="border-b last:border-0">
            <td class="p-3">
              <p class="font-medium">{{ item.userName }}</p>
              <p class="text-slate-500 text-xs">{{ item.userEmail }}</p>
            </td>
            <td class="p-3">{{ formatAmount(item.amount, item.currency) }}</td>
            <td class="p-3 text-slate-600">{{ item.referenceCode || '—' }}</td>
            <td class="p-3 text-slate-600">{{ formatDate(item.transferDate) }}</td>
            <td class="p-3 text-slate-600">{{ item.invoiceNumber || '—' }}</td>
            <td class="p-3">
              <span class="inline-flex px-2 py-0.5 rounded text-xs font-medium" :class="statusClass(item.status)">
                {{ statusLabel(item.status) }}
              </span>
            </td>
            <td class="p-3 text-right">
              <button
                v-if="item.status === 'pending'"
                type="button"
                class="text-indigo-600 hover:underline"
                @click="openReview(item)"
              >
                {{ t('admin.payments.review') }}
              </button>
              <template v-else>
                <a
                  v-if="item.invoicePdfUrl"
                  :href="item.invoicePdfUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-indigo-600 hover:underline text-xs"
                >
                  PDF
                </a>
                <span v-else class="text-slate-400 text-xs">{{ item.reviewerName || '—' }}</span>
              </template>
            </td>
          </tr>
          <tr v-if="!items.length">
            <td colspan="7" class="p-8 text-center text-slate-500">{{ t('admin.empty') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
