import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import { hashPassword } from '../../../shared/utils/password.util.js';
import { usersModel } from './users.model.js';
import { usersView } from './users.view.js';

export const usersController = {
  list: asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const q = req.query.q ?? '';
    const activeParam = req.query.isActive;
    const isActive =
      activeParam === 'true' ? true : activeParam === 'false' ? false : null;

    const result = await usersModel.findPaged({ page, limit, q, isActive });

    sendSuccess(res, {
      message: req.t('admin.users.list.success'),
      data: {
        items: usersView.formatUserList(result.rows),
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
    const user = await usersModel.findById(Number(req.params.userId));
    if (!user) {
      return sendError(res, { status: 404, message: req.t('admin.users.notFound') });
    }
    sendSuccess(res, { data: usersView.formatUser(user) });
  }),

  create: asyncHandler(async (req, res) => {
    const { name, email, password, aiCommandQuota, aiTokenQuota } = req.body;
    const quota = aiCommandQuota !== undefined ? aiCommandQuota : aiTokenQuota;

    if (!name?.trim() || !email?.trim() || !password) {
      return sendError(res, { status: 400, message: req.t('admin.users.missingFields') });
    }
    if (password.length < 8) {
      return sendError(res, { status: 400, message: req.t('admin.users.weakPassword') });
    }

    const existing = await usersModel.findByEmail(email.toLowerCase().trim());
    if (existing) {
      return sendError(res, { status: 409, message: req.t('admin.users.emailExists') });
    }

    const passwordHash = await hashPassword(password);
    const user = await usersModel.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      aiCommandQuota: quota !== undefined ? Number(quota) : undefined,
    });

    sendSuccess(res, {
      status: 201,
      message: req.t('admin.users.create.success'),
      data: usersView.formatUser(user),
    });
  }),

  update: asyncHandler(async (req, res) => {
    const userId = Number(req.params.userId);
    const existing = await usersModel.findById(userId);
    if (!existing) {
      return sendError(res, { status: 404, message: req.t('admin.users.notFound') });
    }

    const { name, email, password, aiCommandQuota, aiTokenQuota } = req.body;
    const quota = aiCommandQuota !== undefined ? aiCommandQuota : aiTokenQuota;
    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) updates.email = email.toLowerCase().trim();
    if (quota !== undefined) updates.aiCommandQuota = Number(quota);
    if (password) {
      if (password.length < 8) {
        return sendError(res, { status: 400, message: req.t('admin.users.weakPassword') });
      }
      updates.passwordHash = await hashPassword(password);
    }

    if (updates.email) {
      const emailOwner = await usersModel.findByEmail(updates.email);
      if (emailOwner && emailOwner.id !== userId) {
        return sendError(res, { status: 409, message: req.t('admin.users.emailExists') });
      }
    }

    const user = await usersModel.update(userId, updates);
    sendSuccess(res, {
      message: req.t('admin.users.update.success'),
      data: usersView.formatUser(user),
    });
  }),

  setActive: asyncHandler(async (req, res) => {
    const userId = Number(req.params.userId);
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return sendError(res, { status: 400, message: req.t('admin.users.missingActive') });
    }

    const existing = await usersModel.findById(userId);
    if (!existing) {
      return sendError(res, { status: 404, message: req.t('admin.users.notFound') });
    }

    const user = await usersModel.setActive(userId, isActive);
    if (!isActive) {
      await usersModel.invalidateSessions(userId);
    }

    sendSuccess(res, {
      message: isActive
        ? req.t('admin.users.activate.success')
        : req.t('admin.users.deactivate.success'),
      data: usersView.formatUser(user),
    });
  }),
};
