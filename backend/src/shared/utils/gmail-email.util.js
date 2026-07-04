const GMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com']);

export function isGmailAddress(email) {
  if (!email || typeof email !== 'string') return false;
  const parts = email.toLowerCase().trim().split('@');
  if (parts.length !== 2) return false;
  return GMAIL_DOMAINS.has(parts[1]);
}
