import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import { settingsModel } from '../../../shared/models/settings.model.js';
import { refreshAppSettings } from '../../../shared/services/app-settings.service.js';
import { resetEmailTransporter } from '../../../shared/services/email.service.js';
import { systemSettingsView } from './system-settings.view.js';

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
};
