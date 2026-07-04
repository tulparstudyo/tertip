import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import {
  getPaymentAmount,
  getPaymentCurrency,
} from '../../../shared/services/app-settings.service.js';
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
    const { senderName, bankName, transferDate, referenceCode, notes } = req.body;
    const amount = getPaymentAmount();

    if (!amount || amount <= 0) {
      return sendError(res, { status: 503, message: req.t('user.payments.amountNotConfigured') });
    }

    const payment = await bankTransferModel.create({
      userId: req.user.id,
      amount,
      currency: getPaymentCurrency(),
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

  downloadInvoice: asyncHandler(async (req, res) => {
    const paymentId = Number(req.params.paymentId);
    const payment = await bankTransferModel.findByIdForUser(paymentId, req.user.id);

    if (!payment) {
      return sendError(res, { status: 404, message: req.t('user.payments.notFound') });
    }
    if (payment.status !== 'approved' || !payment.invoice_pdf_url) {
      return sendError(res, { status: 403, message: req.t('user.payments.invoiceNotAvailable') });
    }

    sendSuccess(res, {
      data: {
        url: payment.invoice_pdf_url,
        invoiceNumber: payment.invoice_number,
      },
    });
  }),
};
