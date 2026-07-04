import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import { standardAbbreviationsModel } from '../../../shared/models/system-settings.model.js';
import {
  buildKisaltmalarListesiDoc,
  validateStandardAbbreviationsPayload,
} from '../../../shared/services/standard-abbreviations.service.js';

export const standardAbbreviationsController = {
  getForUser: asyncHandler(async (req, res) => {
    const data = await standardAbbreviationsModel.getStandardAbbreviations();

    sendSuccess(res, {
      message: req.t('user.standardAbbreviations.get.success'),
      data: {
        ...data,
        content: buildKisaltmalarListesiDoc(data),
      },
    });
  }),

  getForAdmin: asyncHandler(async (req, res) => {
    const data = await standardAbbreviationsModel.getStandardAbbreviations();

    sendSuccess(res, {
      message: req.t('admin.standardAbbreviations.get.success'),
      data,
    });
  }),

  updateForAdmin: asyncHandler(async (req, res) => {
    const validation = validateStandardAbbreviationsPayload(req.body);

    if (!validation.valid) {
      return sendError(res, {
        status: 400,
        message: req.t(`admin.standardAbbreviations.update.${validation.message}`),
      });
    }

    const data = await standardAbbreviationsModel.saveStandardAbbreviations(validation.data);

    sendSuccess(res, {
      message: req.t('admin.standardAbbreviations.update.success'),
      data,
    });
  }),
};
