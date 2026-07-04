import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import { paymentsModel } from './payments.model.js';
import { paymentsView } from './payments.view.js';

const VALID_STATUSES = ['pending', 'approved', 'rejected'];

export const paymentsController = {
  list: asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = VALID_STATUSES.includes(req.query.status) ? req.query.status : null;
    const q = req.query.q ?? '';

    const result = await paymentsModel.findPaged({ page, limit, status, q });

    sendSuccess(res, {
      message: req.t('admin.payments.list.success'),
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

  getById: asyncHandler(async (req, res) => {
    const payment = await paymentsModel.findById(Number(req.params.paymentId));
    if (!payment) {
      return sendError(res, { status: 404, message: req.t('admin.payments.notFound') });
    }
    sendSuccess(res, { data: paymentsView.formatPayment(payment) });
  }),

  approve: asyncHandler(async (req, res) => {
    const paymentId = Number(req.params.paymentId);
    const { adminNotes } = req.body ?? {};

    const existing = await paymentsModel.findById(paymentId);
    if (!existing) {
      return sendError(res, { status: 404, message: req.t('admin.payments.notFound') });
    }
    if (existing.status !== 'pending') {
      return sendError(res, { status: 400, message: req.t('admin.payments.alreadyReviewed') });
    }

    const payment = await paymentsModel.review(paymentId, {
      status: 'approved',
      adminId: req.admin.id,
      adminNotes,
    });

    if (!payment) {
      return sendError(res, { status: 400, message: req.t('admin.payments.alreadyReviewed') });
    }

    const full = await paymentsModel.findById(paymentId);
    sendSuccess(res, {
      message: req.t('admin.payments.approve.success'),
      data: paymentsView.formatPayment(full),
    });
  }),

  reject: asyncHandler(async (req, res) => {
    const paymentId = Number(req.params.paymentId);
    const { adminNotes } = req.body ?? {};

    const existing = await paymentsModel.findById(paymentId);
    if (!existing) {
      return sendError(res, { status: 404, message: req.t('admin.payments.notFound') });
    }
    if (existing.status !== 'pending') {
      return sendError(res, { status: 400, message: req.t('admin.payments.alreadyReviewed') });
    }

    const payment = await paymentsModel.review(paymentId, {
      status: 'rejected',
      adminId: req.admin.id,
      adminNotes,
    });

    if (!payment) {
      return sendError(res, { status: 400, message: req.t('admin.payments.alreadyReviewed') });
    }

    const full = await paymentsModel.findById(paymentId);
    sendSuccess(res, {
      message: req.t('admin.payments.reject.success'),
      data: paymentsView.formatPayment(full),
    });
  }),
};
