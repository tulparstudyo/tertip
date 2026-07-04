<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '@/api/client';
import { useAuth } from '@/composables/useAuth';
import { toast } from '@/composables/useToast';

const { t } = useI18n();
const { user, fetchMe } = useAuth();

const loading = ref(true);
const saving = ref(false);
const passwordResetLoading = ref(false);

const form = ref({
  name: '',
  lastName: '',
  email: '',
  phone: '',
  billingName: '',
  taxOffice: '',
  billingAddress: '',
});

function fillForm(data) {
  form.value = {
    name: data?.name ?? '',
    lastName: data?.lastName ?? '',
    email: data?.email ?? '',
    phone: data?.phone ?? '',
    billingName: data?.billingName ?? '',
    taxOffice: data?.taxOffice ?? '',
    billingAddress: data?.billingAddress ?? '',
  };
}

async function loadProfile() {
  loading.value = true;
  try {
    const data = await fetchMe();
    fillForm(data);
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  saving.value = true;
  try {
    const res = await api('/user/auth/profile', {
      method: 'PUT',
      body: {
        name: form.value.name,
        lastName: form.value.lastName,
        phone: form.value.phone,
        billingName: form.value.billingName,
        taxOffice: form.value.taxOffice,
        billingAddress: form.value.billingAddress,
      },
      notify: true,
    });
    const updated = res.data;
    if (updated) {
      user.value = updated;
      localStorage.setItem('tertip_user', JSON.stringify(updated));
    }
  } finally {
    saving.value = false;
  }
}

async function requestPasswordReset() {
  passwordResetLoading.value = true;
  try {
    await api('/user/auth/request-password-reset', { method: 'POST', notify: true });
    toast.success(t('profile.passwordResetSent', { email: form.value.email }));
  } finally {
    passwordResetLoading.value = false;
  }
}

onMounted(loadProfile);
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-bold mb-2">{{ t('profile.title') }}</h1>
    <p class="text-slate-600 text-sm mb-6">{{ t('profile.subtitle') }}</p>

    <div v-if="loading" class="text-slate-500">{{ t('common.loading') }}</div>

    <form v-else class="space-y-6" @submit.prevent="handleSubmit">
      <section class="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 class="font-semibold text-slate-800">{{ t('profile.personalSection') }}</h2>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">{{ t('profile.firstName') }}</label>
            <input v-model="form.name" required class="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">{{ t('profile.lastName') }}</label>
            <input v-model="form.lastName" class="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('auth.email') }}</label>
          <input
            v-model="form.email"
            type="email"
            disabled
            class="w-full border rounded-lg px-3 py-2 bg-slate-50 text-slate-500"
          />
          <p class="text-xs text-slate-400 mt-1">{{ t('profile.emailHint') }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('profile.phone') }}</label>
          <input v-model="form.phone" type="tel" class="w-full border rounded-lg px-3 py-2" />
        </div>
      </section>

      <section class="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 class="font-semibold text-slate-800">{{ t('profile.billingSection') }}</h2>
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('profile.billingName') }}</label>
          <input v-model="form.billingName" class="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('profile.taxOffice') }}</label>
          <input v-model="form.taxOffice" class="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('profile.billingAddress') }}</label>
          <textarea v-model="form.billingAddress" rows="3" class="w-full border rounded-lg px-3 py-2" />
        </div>
      </section>

      <section class="bg-white rounded-xl border border-slate-200 p-6">
        <h2 class="font-semibold text-slate-800 mb-2">{{ t('profile.securitySection') }}</h2>
        <p class="text-sm text-slate-500 mb-4">{{ t('profile.passwordHint') }}</p>
        <button
          type="button"
          class="border border-slate-300 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50"
          :disabled="passwordResetLoading"
          @click="requestPasswordReset"
        >
          {{ passwordResetLoading ? t('common.loading') : t('profile.changePassword') }}
        </button>
      </section>

      <button
        type="submit"
        :disabled="saving"
        class="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {{ saving ? t('common.loading') : t('common.save') }}
      </button>
    </form>
  </div>
</template>
