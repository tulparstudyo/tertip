import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';

const navHidden = ref(false);

let lastScrollY = 0;
let listenerAttached = false;

const SCROLL_DELTA = 10;
const TOP_REVEAL = 48;

function onScroll() {
  if (!navAutoHideEnabled.value) {
    navHidden.value = false;
    lastScrollY = window.scrollY;
    return;
  }

  const y = window.scrollY;
  const delta = y - lastScrollY;

  if (y <= TOP_REVEAL) {
    navHidden.value = false;
  } else if (delta > SCROLL_DELTA) {
    navHidden.value = true;
  } else if (delta < -SCROLL_DELTA) {
    navHidden.value = false;
  }

  lastScrollY = y;
}

export const navAutoHideEnabled = ref(false);

export function useNavAutoHide() {
  const route = useRoute();

  const isEditorRoute = computed(() => route.name === 'project-editor');

  function syncRouteState(active) {
    navAutoHideEnabled.value = active;
    if (!active) {
      navHidden.value = false;
      lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    }
  }

  function attachScrollListener() {
    if (listenerAttached || typeof window === 'undefined') return;
    listenerAttached = true;
    lastScrollY = window.scrollY;
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  return {
    navHidden,
    isEditorRoute,
    syncRouteState,
    attachScrollListener,
  };
}
