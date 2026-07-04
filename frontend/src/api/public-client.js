import { i18n } from '@/i18n';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

export async function fetchLandingContent() {
  const response = await fetch(`${API_BASE}/public/landing`, {
    headers: {
      'Accept-Language': i18n.global.locale.value,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message ?? 'Failed to load landing content');
  }

  return data.data?.content ?? null;
}
