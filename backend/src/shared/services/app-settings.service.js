import { settingsModel } from '../models/settings.model.js';

let cache = new Map();

const ENV_FALLBACKS = {
  WHATSAPP_NUMBER: () => process.env.WHATSAPP_NUMBER?.trim() || null,
  PAYMENT_AMOUNT: () => process.env.PAYMENT_AMOUNT?.trim() || null,
  PAYMENT_CURRENCY: () => process.env.PAYMENT_CURRENCY?.trim() || null,
  SMTP_HOST: () => process.env.SMTP_HOST?.trim() || null,
  SMTP_PORT: () => process.env.SMTP_PORT?.trim() || null,
  SMTP_SECURE: () => process.env.SMTP_SECURE?.trim() || null,
  SMTP_USER: () => process.env.SMTP_USER?.trim() || null,
  SMTP_PASS: () => process.env.SMTP_PASS?.trim() || null,
  SMTP_FROM: () => process.env.SMTP_FROM?.trim() || null,
  PASSWORD_RESET_EXPIRES_HOURS: () => process.env.PASSWORD_RESET_EXPIRES_HOURS?.trim() || null,
};

async function importEnvFallbacksIfEmpty() {
  const items = await settingsModel.findAll();
  const updates = [];

  for (const item of items) {
    const fallback = ENV_FALLBACKS[item.settingCode]?.();
    if (fallback && !item.settingValue?.trim()) {
      updates.push({ id: item.id, settingValue: fallback });
    }
  }

  if (updates.length > 0) {
    await settingsModel.updateValues(updates);
  }
}

export async function initAppSettings() {
  await importEnvFallbacksIfEmpty();
  await refreshAppSettings();
}

export async function refreshAppSettings() {
  const items = await settingsModel.findAll();
  cache = new Map(items.map((item) => [item.settingCode, item.settingValue]));
  return items;
}

export function getSetting(code, fallback = '') {
  const value = cache.get(code);
  if (value === undefined || value === null) return fallback;
  return value;
}

export function getSettingsMap() {
  return Object.fromEntries(cache.entries());
}

export function getWhatsappNumber() {
  const value = getSetting('WHATSAPP_NUMBER').trim();
  return value || null;
}

export function getPaymentAmount() {
  const value = Number(getSetting('PAYMENT_AMOUNT'));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function getPaymentCurrency() {
  const value = getSetting('PAYMENT_CURRENCY').trim();
  return value || 'TRY';
}

export function getSmtpConfig() {
  return {
    host: getSetting('SMTP_HOST').trim() || null,
    port: Number(getSetting('SMTP_PORT')) || 587,
    secure: getSetting('SMTP_SECURE').trim().toLowerCase() === 'true',
    user: getSetting('SMTP_USER').trim() || null,
    pass: getSetting('SMTP_PASS').trim() || null,
    from: getSetting('SMTP_FROM').trim() || null,
  };
}

export function getPasswordResetExpiresHours() {
  const value = Number(getSetting('PASSWORD_RESET_EXPIRES_HOURS'));
  return Number.isFinite(value) && value > 0 ? value : 1;
}
