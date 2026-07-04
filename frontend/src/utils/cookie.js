export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name, value, maxAgeDays = 365) {
  if (typeof document === 'undefined') return;
  const maxAge = Math.floor(maxAgeDays * 24 * 60 * 60);
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(String(value))}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
