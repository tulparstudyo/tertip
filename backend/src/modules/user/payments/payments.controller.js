import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import { bankTransferModel } from './payments.model.js';
import { paymentsView } from './payments.view.js';

export const paymentsController = {
  list: asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await bankTransferModel.findPagedByUserId(req.user.id, { page, limit });

    sendSuccess(res, {
      message: req.t('user.payments.list.success'),
      data: {
        items: paymentsView.formatPaymentList(result.rows),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
    });
  }),

  create: asyncHandler(async (req, res) => {
    const { amount, currency, senderName, bankName, transferDate, referenceCode, notes } = req.body;

    if (!amount || Number(amount) <= 0) {
      return sendError(res, { status: 400, message: req.t('user.payments.missingAmount') });
    }

    const payment = await bankTransferModel.create({
      userId: req.user.id,
      amount: Number(amount),
      currency,
      senderName,
      bankName,
      transferDate,
      referenceCode,
      notes,
    });

    sendSuccess(res, {
      status: 201,
      message: req.t('user.payments.create.success'),
      data: paymentsView.formatPayment(payment),
    });
  }),
};
