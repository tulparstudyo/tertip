import { Router } from 'express';
import { asyncHandler } from '../shared/utils/async-handler.util.js';
import { sendSuccess } from '../shared/utils/api-response.util.js';
import { landingModel } from '../modules/admin/landing/landing.model.js';
import { landingView } from '../modules/admin/landing/landing.view.js';
import {
  getWhatsappNumber,
  getPaymentAmount,
  getPaymentCurrency,
} from '../shared/services/app-settings.service.js';
import { themeSettingsController } from '../modules/admin/settings/theme-settings.controller.js';

const router = Router();

router.get(
  '/landing',
  asyncHandler(async (req, res) => {
    const data = await landingModel.getContent();
    sendSuccess(res, {
      message: req.t('public.landing.get.success'),
      data: landingView.formatLanding(data, { resolveSettings: true }),
    });
  }),
);

router.get(
  '/site-config',
  asyncHandler(async (req, res) => {
    sendSuccess(res, {
      message: req.t('public.siteConfig.get.success'),
      data: {
        whatsappNumber: getWhatsappNumber(),
        paymentAmount: getPaymentAmount(),
        paymentCurrency: getPaymentCurrency(),
      },
    });
  }),
);

router.get('/theme', themeSettingsController.getPublic);

export default router;
