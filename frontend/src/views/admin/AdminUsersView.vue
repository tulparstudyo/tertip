<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { adminApi } from '@/api/admin-client';

const { t } = useI18n();

const items = ref([]);
const loading = ref(true);
const page = ref(1);
const pagination = ref({ total: 0, totalPages: 1 });
const searchQuery = ref('');
const filterActive = ref('');
const showForm = ref(false);
const saving = ref(false);
const editingId = ref(null);

const form = ref({
  name: '',
  email: '',
  password: '',
  aiTokenQuota: 500000,
});

const isEditing = computed(() => editingId.value !== null);

function emptyForm() {
  form.value = { name: '', email: '', password: '', aiTokenQuota: 500000 };
  editingId.value = null;
}

function openCreate() {
  emptyForm();
  showForm.value = true;
}

function openEdit(item) {
  editingId.value = item.id;
  form.value = {
    name: item.name,
    email: item.email,
    password: '',
    aiTokenQuota: item.aiTokenQuota,
  };
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  emptyForm();
}

async function loadItems() {
  loading.value = true;
  try {
    const res = await adminApi('/users', {
      silent: true,
      query: {
        page: page.value,
        limit: 20,
        q: searchQuery.value.trim(),
        isActive: filterActive.value || undefined,
      },
    });
    items.value = res.data?.items ?? [];
    pagination.value = res.data?.pagination ?? { total: 0, totalPages: 1 };
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  saving.value = true;
  try {
    if (isEditing.value) {
      const body = {
        name: form.value.name,
        email: form.value.email,
        aiTokenQuota: Number(form.value.aiTokenQuota),
      };
      if (form.value.password) body.password = form.value.password;
      await adminApi(`/users/${editingId.value}`, { method: 'PUT', body, notify: true });
    } else {
      await adminApi('/users', {
        method: 'POST',
        body: form.value,
        notify: true,
      });
    }
    closeForm();
    await loadItems();
  } finally {
    saving.value = false;
  }
}

async function toggleActive(item) {
  await adminApi(`/users/${item.id}/active`, {
    method: 'PATCH',
    body: { isActive: !item.isActive },
    notify: true,
  });
  await loadItems();
}

function formatQuota(used, quota) {
  return `${Math.round(used / 1000)}K / ${Math.round(quota / 1000)}K`;
}

onMounted(loadItems);
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-3 items-center justify-between">
      <div class="flex gap-2">
        <input
          v-model="searchQuery"
          type="search"
          :placeholder="t('admin.search')"
          class="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64"
          @keyup.enter="page = 1; loadItems()"
        />
        <select v-model="filterActive" class="border rounded-lg px-3 py-2 text-sm" @change="page = 1; loadItems()">
          <option value="">{{ t('admin.allStatuses') }}</option>
          <option value="true">{{ t('admin.active') }}</option>
          <option value="false">{{ t('admin.inactive') }}</option>
        </select>
      </div>
      <button
        type="button"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
        @click="openCreate"
      >
        {{ t('admin.users.create') }}
      </button>
    </div>

    <div v-if="showForm" class="bg-white rounded-xl border border-slate-200 p-6">
      <h3 class="font-semibold text-slate-800 mb-4">
        {{ isEditing ? t('admin.users.edit') : t('admin.users.create') }}
      </h3>
      <form class="grid sm:grid-cols-2 gap-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('auth.name') }}</label>
          <input v-model="form.name" required class="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('auth.email') }}</label>
          <input v-model="form.email" type="email" required class="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">
            {{ t('auth.password') }}
            <span v-if="isEditing" class="text-slate-400 font-normal">({{ t('admin.optional') }})</span>
          </label>
          <input
            v-model="form.password"
            type="password"
            :required="!isEditing"
            minlength="8"
            class="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('admin.users.aiQuota') }}</label>
          <input v-model.number="form.aiTokenQuota" type="number" min="0" class="w-full border rounded-lg px-3 py-2" />
        </div>
        <div class="sm:col-span-2 flex gap-2">
          <button type="submit" :disabled="saving" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">
            {{ saving ? t('common.loading') : t('common.save') }}
          </button>
          <button type="button" class="px-4 py-2 rounded-lg border text-sm" @click="closeForm">
            {{ t('common.cancel') }}
          </button>
        </div>
      </form>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-slate-500">{{ t('common.loading') }}</div>
      <table v-else class="w-full text-sm">
        <thead class="bg-slate-50 border-b">
          <tr>
            <th class="text-left p-3 font-medium">{{ t('auth.name') }}</th>
            <th class="text-left p-3 font-medium">{{ t('auth.email') }}</th>
            <th class="text-left p-3 font-medium">{{ t('admin.users.aiQuota') }}</th>
            <th class="text-left p-3 font-medium">{{ t('admin.status') }}</th>
            <th class="text-right p-3 font-medium">{{ t('admin.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id" class="border-b last:border-0">
            <td class="p-3">{{ item.name }}</td>
            <td class="p-3 text-slate-600">{{ item.email }}</td>
            <td class="p-3 text-slate-600">{{ formatQuota(item.aiTokenUsed, item.aiTokenQuota) }}</td>
            <td class="p-3">
              <span
                class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                :class="item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
              >
                {{ item.isActive ? t('admin.active') : t('admin.inactive') }}
              </span>
            </td>
            <td class="p-3 text-right space-x-2">
              <button type="button" class="text-indigo-600 hover:underline" @click="openEdit(item)">
                {{ t('common.edit') }}
              </button>
              <button
                type="button"
                class="hover:underline"
                :class="item.isActive ? 'text-red-600' : 'text-green-600'"
                @click="toggleActive(item)"
              >
                {{ item.isActive ? t('admin.deactivate') : t('admin.activate') }}
              </button>
            </td>
          </tr>
          <tr v-if="!items.length">
            <td colspan="5" class="p-8 text-center text-slate-500">{{ t('admin.empty') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
