import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import { landingModel } from './landing.model.js';
import { landingView } from './landing.view.js';

export const landingController = {
  get: asyncHandler(async (req, res) => {
    const data = await landingModel.getContent();
    sendSuccess(res, {
      message: req.t('admin.landing.get.success'),
      data: landingView.formatLanding(data),
    });
  }),

  update: asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content || typeof content !== 'object') {
      return sendError(res, { status: 400, message: req.t('admin.landing.missingContent') });
    }

    const data = await landingModel.saveContent(content);
    sendSuccess(res, {
      message: req.t('admin.landing.update.success'),
      data: landingView.formatLanding(data),
    });
  }),
};
