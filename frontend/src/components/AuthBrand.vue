<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col items-center gap-2 mb-6">
    <img
      src="/tertip-logo.svg"
      alt=""
      class="h-10 w-10 shrink-0 text-indigo-700"
      width="40"
      height="40"
    />
    <span class="text-xl font-bold text-indigo-700">{{ t('app.name') }}</span>
  </div>
</template>
