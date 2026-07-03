<script setup>
import { useToast, dismissToast } from '@/composables/useToast';

const { toasts } = useToast();

const typeStyles = {
  success: 'border-green-200 bg-green-50 text-green-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-900',
};
</script>

<template>
  <div
    class="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 sm:px-0"
    aria-live="polite"
  >
    <TransitionGroup name="toast">
      <div
        v-for="item in toasts"
        :key="item.id"
        class="pointer-events-auto rounded-lg border shadow-lg px-4 py-3 text-sm flex items-start gap-3"
        :class="typeStyles[item.type] ?? typeStyles.info"
        role="alert"
      >
        <p class="flex-1 leading-snug">{{ item.message }}</p>
        <button
          type="button"
          class="shrink-0 opacity-60 hover:opacity-100 text-lg leading-none"
          aria-label="Close"
          @click="dismissToast(item.id)"
        >
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}

.toast-move {
  transition: transform 0.25s ease;
}
</style>
