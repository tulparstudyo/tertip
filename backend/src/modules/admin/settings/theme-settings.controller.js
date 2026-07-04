import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import { themeSettingsModel } from '../../../shared/models/theme-settings.model.js';
import { validateThemeSettingsPayload } from '../../../shared/services/theme-settings.service.js';
import { themeSettingsView } from './theme-settings.view.js';

export const themeSettingsController = {
  getForAdmin: asyncHandler(async (req, res) => {
    const data = await themeSettingsModel.getThemeSettings();
    sendSuccess(res, {
      message: req.t('admin.themeSettings.get.success'),
      data: themeSettingsView.formatTheme(data),
    });
  }),

  updateForAdmin: asyncHandler(async (req, res) => {
    const validation = validateThemeSettingsPayload(req.body?.theme ?? req.body);

    if (!validation.valid) {
      return sendError(res, {
        status: 400,
        message: req.t(`admin.themeSettings.update.${validation.message}`),
      });
    }

    const data = await themeSettingsModel.saveThemeSettings(validation.data);
    sendSuccess(res, {
      message: req.t('admin.themeSettings.update.success'),
      data: themeSettingsView.formatTheme(data),
    });
  }),

  getPublic: asyncHandler(async (req, res) => {
    const data = await themeSettingsModel.getThemeSettings();
    sendSuccess(res, {
      message: req.t('public.themeSettings.get.success'),
      data: themeSettingsView.formatTheme(data),
    });
  }),
};
