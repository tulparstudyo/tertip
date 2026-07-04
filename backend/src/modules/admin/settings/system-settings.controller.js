import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import { settingsModel } from '../../../shared/models/settings.model.js';
import {
  refreshAppSettings,
  getSmtpConfig,
  buildSmtpConfigFromSettingsList,
} from '../../../shared/services/app-settings.service.js';
import { resetEmailTransporter, sendTestEmail } from '../../../shared/services/email.service.js';
import { systemSettingsView } from './system-settings.view.js';

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim());
}

export const systemSettingsController = {
  list: asyncHandler(async (req, res) => {
    const items = await settingsModel.findAll();
    sendSuccess(res, {
      message: req.t('admin.settings.get.success'),
      data: systemSettingsView.formatList(items),
    });
  }),

  update: asyncHandler(async (req, res) => {
    const { settings } = req.body;

    if (!Array.isArray(settings) || settings.length === 0) {
      return sendError(res, { status: 400, message: req.t('admin.settings.missingSettings') });
    }

    for (const item of settings) {
      if (!item?.id || typeof item.settingValue !== 'string') {
        return sendError(res, { status: 400, message: req.t('admin.settings.invalidItem') });
      }
    }

    const updated = await settingsModel.updateValues(settings);
    const items = await refreshAppSettings();
    resetEmailTransporter();

    sendSuccess(res, {
      message: req.t('admin.settings.update.success'),
      data: systemSettingsView.formatList(items.length ? items : updated),
    });
  }),

  testEmail: asyncHandler(async (req, res) => {
    const to = String(req.body?.to ?? '').trim();

    if (!isValidEmail(to)) {
      return sendError(res, {
        status: 400,
        message: req.t('admin.settings.testEmail.invalidEmail'),
      });
    }

    const smtp =
      buildSmtpConfigFromSettingsList(req.body?.settings) ?? getSmtpConfig();

    if (!smtp.host) {
      return sendError(res, {
        status: 400,
        message: req.t('admin.settings.testEmail.missingHost'),
      });
    }

    try {
      await sendTestEmail({ to, smtp, locale: req.locale ?? 'tr' });
      sendSuccess(res, {
        message: req.t('admin.settings.testEmail.success'),
        data: { to },
      });
    } catch (err) {
      console.error('SMTP test email failed:', err);
      return sendError(res, {
        status: 502,
        message: req.t('admin.settings.testEmail.failed'),
        errors: err?.message ? [{ message: err.message }] : undefined,
      });
    }
  }),
};
