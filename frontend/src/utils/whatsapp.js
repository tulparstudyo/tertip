export function normalizeWhatsAppNumber(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  return digits || null;
}

export function buildWhatsAppUrl(number, message = '') {
  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized) return null;

  const trimmedMessage = String(message ?? '').trim();
  const query = trimmedMessage ? `?text=${encodeURIComponent(trimmedMessage)}` : '';
  return `https://wa.me/${normalized}${query}`;
}
