import { Router } from 'express';
import { asyncHandler } from '../shared/utils/async-handler.util.js';
import { sendSuccess } from '../shared/utils/api-response.util.js';
import { landingModel } from '../modules/admin/landing/landing.model.js';
import { landingView } from '../modules/admin/landing/landing.view.js';

const router = Router();

router.get(
  '/landing',
  asyncHandler(async (req, res) => {
    const data = await landingModel.getContent();
    sendSuccess(res, {
      message: req.t('public.landing.get.success'),
      data: landingView.formatLanding(data),
    });
  }),
);

export default router;
