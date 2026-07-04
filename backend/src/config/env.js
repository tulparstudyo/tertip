import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.DATABASE_URL) {
  throw new Error('Missing required env: DATABASE_URL');
}

if (isProduction && (!process.env.JWT_USER_SECRET || !process.env.JWT_ADMIN_SECRET)) {
  throw new Error('Missing required env: JWT_USER_SECRET and JWT_ADMIN_SECRET');
}

function parseDatabaseSsl() {
  const value = process.env.DATABASE_SSL?.trim().toLowerCase();
  if (value === 'true' || value === '1') {
    return { rejectUnauthorized: false };
  }
  if (value === 'false' || value === '0') {
    return false;
  }
  // Cloud SQL unix socket needs no TLS; external hosts default to plain TCP.
  const url = process.env.DATABASE_URL ?? '';
  if (url.includes('/cloudsql/')) {
    return false;
  }
  return false;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT) || 8080,
  databaseUrl: process.env.DATABASE_URL ?? null,
  databaseSsl: parseDatabaseSsl(),
  defaultLocale: 'tr',
  supportedLocales: ['tr', 'en'],
  jwtUserSecret: process.env.JWT_USER_SECRET ?? 'dev-user-secret-change-me',
  jwtAdminSecret: process.env.JWT_ADMIN_SECRET ?? 'dev-admin-secret-change-me',
  jwtUserAccessExpiresIn: process.env.JWT_USER_ACCESS_EXPIRES_IN ?? '15m',
  jwtAdminAccessExpiresIn: process.env.JWT_ADMIN_ACCESS_EXPIRES_IN ?? '8h',
  jwtRefreshExpiresDays: Number(process.env.JWT_REFRESH_EXPIRES_DAYS) || 30,
  streamGatewayExpiresIn: process.env.STREAM_GATEWAY_EXPIRES_IN ?? '30m',
  frontendUrl: process.env.FRONTEND_URL ?? null,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? null,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? null,
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:8080/api/v1/user/google/callback',
  },
  geminiApiKey: process.env.GEMINI_API_KEY ?? null,
  geminiModelFlash: process.env.GEMINI_MODEL_FLASH ?? 'gemini-2.5-flash',
  geminiModelPro: process.env.GEMINI_MODEL_PRO ?? 'gemini-2.5-pro',
  whatsappNumber: process.env.WHATSAPP_NUMBER?.trim() || null,
  paymentAmount: Number(process.env.PAYMENT_AMOUNT) || null,
  paymentCurrency: process.env.PAYMENT_CURRENCY?.trim() || 'TRY',
  smtp: {
    host: process.env.SMTP_HOST?.trim() || null,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER?.trim() || null,
    pass: process.env.SMTP_PASS?.trim() || null,
    from: process.env.SMTP_FROM?.trim() || null,
  },
  passwordResetExpiresHours: Number(process.env.PASSWORD_RESET_EXPIRES_HOURS) || 1,
  emailVerificationExpiresHours: Number(process.env.EMAIL_VERIFICATION_EXPIRES_HOURS) || 48,
};
