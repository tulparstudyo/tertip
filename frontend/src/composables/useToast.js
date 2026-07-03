import { reactive, readonly } from 'vue';

const state = reactive({ toasts: [] });
let nextId = 0;

function addToast(type, message) {
  const text = message?.trim();
  if (!text) return;

  const id = ++nextId;
  state.toasts.push({ id, type, message: text });

  setTimeout(() => dismissToast(id), 4500);
}

export function dismissToast(id) {
  const index = state.toasts.findIndex((item) => item.id === id);
  if (index >= 0) state.toasts.splice(index, 1);
}

export const toast = {
  success: (message) => addToast('success', message),
  error: (message) => addToast('error', message),
  warning: (message) => addToast('warning', message),
  info: (message) => addToast('info', message),
  dismiss: dismissToast,
};

export function useToast() {
  return {
    toasts: readonly(state.toasts),
    dismiss: dismissToast,
  };
}
