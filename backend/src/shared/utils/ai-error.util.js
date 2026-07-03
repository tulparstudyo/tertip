import { sendError } from './api-response.util.js';

export function normalizeGeminiError(err) {
  const message = err?.message ?? '';
  const status = err?.status ?? err?.statusCode ?? err?.response?.status;

  if (/prepayment credits are depleted|billing.*depleted|check your billing/i.test(message)) {
    const wrapped = new Error('GEMINI_BILLING_EXHAUSTED');
    wrapped.cause = err;
    return wrapped;
  }

  if (
    status === 404 ||
    /404 Not Found|is no longer available|not found.*models\//i.test(message)
  ) {
    const wrapped = new Error('GEMINI_MODEL_NOT_FOUND');
    wrapped.cause = err;
    return wrapped;
  }

  if (status === 429 || /429 Too Many Requests|resource exhausted|rate limit/i.test(message)) {
    const wrapped = new Error('GEMINI_RATE_LIMITED');
    wrapped.cause = err;
    return wrapped;
  }

  if (/^\[GoogleGenerativeAI Error\]/i.test(message)) {
    const wrapped = new Error('GEMINI_API_ERROR');
    wrapped.cause = err;
    return wrapped;
  }

  return err;
}

export function handleAiError(err, req, res) {
  if (err.message === 'GEMINI_NOT_CONFIGURED') {
    sendError(res, { status: 503, message: req.t('user.ai.notConfigured') });
    return true;
  }

  if (err.message === 'AI_QUOTA_EXCEEDED') {
    sendError(res, { status: 429, message: req.t('user.ai.quotaExceeded') });
    return true;
  }

  if (err.message === 'GEMINI_BILLING_EXHAUSTED') {
    sendError(res, { status: 429, message: req.t('user.ai.billingExhausted') });
    return true;
  }

  if (err.message === 'GEMINI_RATE_LIMITED') {
    sendError(res, { status: 429, message: req.t('user.ai.rateLimited') });
    return true;
  }

  if (err.message === 'GEMINI_MODEL_NOT_FOUND') {
    sendError(res, { status: 503, message: req.t('user.ai.modelNotFound') });
    return true;
  }

  if (err.message === 'GEMINI_API_ERROR') {
    sendError(res, { status: 502, message: req.t('user.ai.requestFailed') });
    return true;
  }

  return false;
}
