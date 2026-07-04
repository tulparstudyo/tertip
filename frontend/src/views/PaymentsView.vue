<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { IconPlus, IconDownload } from '@tabler/icons-vue';
import { api } from '@/api/client';
import { fetchLandingContent, fetchSiteConfig } from '@/api/public-client';
import { tablerIconProps } from '@/constants/icons.js';

const { t } = useI18n();
const actionIcon = tablerIconProps.toolbar;

const items = ref([]);
const loading = ref(true);
const page = ref(1);
const pagination = ref({ total: 0, totalPages: 1 });
const bankInfo = ref(null);
const paymentAmount = ref(null);
const paymentCurrency = ref('TRY');
const showForm = ref(false);
const saving = ref(false);
const downloadingId = ref(null);

const canCreatePayment = computed(() => paymentAmount.value > 0);

const formattedPaymentAmount = computed(() => {
  if (!paymentAmount.value) return '—';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: paymentCurrency.value || 'TRY',
  }).format(paymentAmount.value);
});

const form = ref({
  senderName: '',
  bankName: '',
  transferDate: '',
  referenceCode: '',
  notes: '',
});

function emptyForm() {
  form.value = {
    senderName: '',
    bankName: '',
    transferDate: '',
    referenceCode: '',
    notes: '',
  };
}

async function loadItems() {
  loading.value = true;
  try {
    const res = await api('/user/payments', {
      silent: true,
      query: { page: page.value, limit: 20 },
    });
    items.value = res.data?.items ?? [];
    pagination.value = res.data?.pagination ?? { total: 0, totalPages: 1 };
  } finally {
    loading.value = false;
  }
}

async function loadBankInfo() {
  try {
    const content = await fetchLandingContent();
    bankInfo.value = content?.bankInfo ?? null;
  } catch {
    bankInfo.value = null;
  }
}

async function loadPaymentConfig() {
  try {
    const data = await fetchSiteConfig();
    paymentAmount.value = Number(data?.paymentAmount) || null;
    paymentCurrency.value = data?.paymentCurrency || 'TRY';
  } catch {
    paymentAmount.value = null;
  }
}

function openForm() {
  emptyForm();
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  emptyForm();
}

async function handleSubmit() {
  saving.value = true;
  try {
    await api('/user/payments', {
      method: 'POST',
      body: {
        senderName: form.value.senderName.trim() || undefined,
        bankName: form.value.bankName.trim() || undefined,
        transferDate: form.value.transferDate || undefined,
        referenceCode: form.value.referenceCode.trim() || undefined,
        notes: form.value.notes.trim() || undefined,
      },
      notify: true,
    });
    closeForm();
    page.value = 1;
    await loadItems();
  } finally {
    saving.value = false;
  }
}

async function downloadInvoice(item) {
  downloadingId.value = item.id;
  try {
    const res = await api(`/user/payments/${item.id}/invoice`, { silent: true });
    const url = res.data?.url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } finally {
    downloadingId.value = null;
  }
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
  return t(`payments.status.${status}`);
}

function goToPage(nextPage) {
  if (nextPage < 1 || nextPage > pagination.value.totalPages) return;
  page.value = nextPage;
  loadItems();
}

onMounted(async () => {
  await Promise.all([loadItems(), loadBankInfo(), loadPaymentConfig()]);
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">{{ t('payments.title') }}</h1>
        <p class="text-slate-600 text-sm mt-1">{{ t('payments.subtitle') }}</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
        :disabled="!canCreatePayment"
        @click="openForm"
      >
        <IconPlus v-bind="actionIcon" aria-hidden="true" />
        {{ t('payments.create') }}
      </button>
    </div>

    <div v-if="bankInfo" class="bg-white rounded-xl border border-slate-200 p-5 text-sm">
      <h2 class="font-semibold text-slate-800 mb-3">{{ t('payments.bankInfo') }}</h2>
      <dl class="grid sm:grid-cols-2 gap-3">
        <div>
          <dt class="text-slate-500">{{ t('landing.payment.bank') }}</dt>
          <dd class="font-medium">{{ bankInfo.bankName || '—' }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">{{ t('landing.payment.holder') }}</dt>
          <dd class="font-medium">{{ bankInfo.accountHolder || '—' }}</dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-slate-500">IBAN</dt>
          <dd class="font-mono text-xs break-all">{{ bankInfo.iban || '—' }}</dd>
        </div>
      </dl>
    </div>

    <div v-if="showForm" class="bg-white rounded-xl border border-indigo-200 p-6">
      <h3 class="font-semibold text-slate-800 mb-4">{{ t('payments.createTitle') }}</h3>
      <form class="grid sm:grid-cols-2 gap-4" @submit.prevent="handleSubmit">
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium mb-1">{{ t('payments.amount') }}</label>
          <p class="text-lg font-semibold text-slate-800 bg-slate-50 border rounded-lg px-3 py-2">
            {{ formattedPaymentAmount }}
          </p>
          <p class="text-xs text-slate-400 mt-1">{{ t('payments.fixedAmountHint') }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('payments.senderName') }}</label>
          <input v-model="form.senderName" class="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('payments.bankName') }}</label>
          <input v-model="form.bankName" class="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('payments.transferDate') }}</label>
          <input v-model="form.transferDate" type="date" class="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('payments.reference') }}</label>
          <input v-model="form.referenceCode" class="w-full border rounded-lg px-3 py-2" />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium mb-1">{{ t('payments.notes') }}</label>
          <textarea v-model="form.notes" rows="2" class="w-full border rounded-lg px-3 py-2" />
        </div>
        <div class="sm:col-span-2 flex gap-2">
          <button type="submit" :disabled="saving" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">
            {{ saving ? t('common.loading') : t('payments.submit') }}
          </button>
          <button type="button" class="px-4 py-2 rounded-lg border text-sm" @click="closeForm">
            {{ t('common.cancel') }}
          </button>
        </div>
      </form>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-page">
      <div v-if="loading" class="p-8 text-center text-slate-500">{{ t('common.loading') }}</div>
      <table v-else class="w-full text-sm">
        <thead class="bg-slate-50 border-b">
          <tr>
            <th class="text-left p-3 font-medium">{{ t('payments.date') }}</th>
            <th class="text-left p-3 font-medium">{{ t('payments.amount') }}</th>
            <th class="text-left p-3 font-medium">{{ t('payments.reference') }}</th>
            <th class="text-left p-3 font-medium">{{ t('payments.status') }}</th>
            <th class="text-left p-3 font-medium">{{ t('payments.invoice') }}</th>
            <th class="text-right p-3 font-medium">{{ t('payments.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id" class="border-b last:border-0">
            <td class="p-3 text-slate-600">{{ formatDate(item.transferDate || item.createdAt) }}</td>
            <td class="p-3 font-medium">{{ formatAmount(item.amount, item.currency) }}</td>
            <td class="p-3 text-slate-600">{{ item.referenceCode || '—' }}</td>
            <td class="p-3">
              <span class="inline-flex px-2 py-0.5 rounded text-xs font-medium" :class="statusClass(item.status)">
                {{ statusLabel(item.status) }}
              </span>
              <p v-if="item.adminNotes" class="text-xs text-slate-400 mt-1 max-w-xs">{{ item.adminNotes }}</p>
            </td>
            <td class="p-3 text-slate-600">
              <template v-if="item.invoiceNumber">{{ item.invoiceNumber }}</template>
              <span v-else>—</span>
            </td>
            <td class="p-3 text-right">
              <button
                v-if="item.status === 'approved' && item.hasInvoice"
                type="button"
                class="inline-flex items-center gap-1 text-indigo-600 hover:underline disabled:opacity-50"
                :disabled="downloadingId === item.id"
                @click="downloadInvoice(item)"
              >
                <IconDownload v-bind="actionIcon" aria-hidden="true" />
                {{ t('payments.downloadInvoice') }}
              </button>
              <span v-else class="text-slate-400">—</span>
            </td>
          </tr>
          <tr v-if="!items.length">
            <td colspan="6" class="p-8 text-center text-slate-500">{{ t('payments.empty') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="pagination.totalPages > 1"
      class="flex items-center justify-between text-sm text-slate-600"
    >
      <p>{{ t('payments.pageInfo', { page: pagination.page, totalPages: pagination.totalPages, total: pagination.total }) }}</p>
      <div class="flex gap-2">
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg border disabled:opacity-40"
          :disabled="page <= 1"
          @click="goToPage(page - 1)"
        >
          {{ t('payments.prev') }}
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg border disabled:opacity-40"
          :disabled="page >= pagination.totalPages"
          @click="goToPage(page + 1)"
        >
          {{ t('payments.next') }}
        </button>
      </div>
    </div>
  </div>
</template>
