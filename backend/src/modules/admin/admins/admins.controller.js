import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import { hashPassword } from '../../../shared/utils/password.util.js';
import { adminsModel } from './admins.model.js';
import { adminsView } from './admins.view.js';

const VALID_ROLES = ['support', 'manager', 'super_admin'];

function validateRole(role) {
  return VALID_ROLES.includes(role);
}

export const adminsController = {
  list: asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const q = req.query.q ?? '';

    const result = await adminsModel.findPaged({ page, limit, q });

    sendSuccess(res, {
      message: req.t('admin.admins.list.success'),
      data: {
        items: adminsView.formatAdminList(result.rows),
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
    const admin = await adminsModel.findById(Number(req.params.adminId));
    if (!admin) {
      return sendError(res, { status: 404, message: req.t('admin.admins.notFound') });
    }
    sendSuccess(res, { data: adminsView.formatAdmin(admin) });
  }),

  create: asyncHandler(async (req, res) => {
    const { name, email, password, role = 'manager' } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return sendError(res, { status: 400, message: req.t('admin.admins.missingFields') });
    }
    if (password.length < 8) {
      return sendError(res, { status: 400, message: req.t('admin.admins.weakPassword') });
    }
    if (!validateRole(role)) {
      return sendError(res, { status: 400, message: req.t('admin.admins.invalidRole') });
    }

    const existing = await adminsModel.findByEmail(email.toLowerCase().trim());
    if (existing) {
      return sendError(res, { status: 409, message: req.t('admin.admins.emailExists') });
    }

    const passwordHash = await hashPassword(password);
    const admin = await adminsModel.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
    });

    sendSuccess(res, {
      status: 201,
      message: req.t('admin.admins.create.success'),
      data: adminsView.formatAdmin(admin),
    });
  }),

  update: asyncHandler(async (req, res) => {
    const adminId = Number(req.params.adminId);
    const existing = await adminsModel.findById(adminId);
    if (!existing) {
      return sendError(res, { status: 404, message: req.t('admin.admins.notFound') });
    }

    const { name, email, password, role } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) updates.email = email.toLowerCase().trim();
    if (role !== undefined) {
      if (!validateRole(role)) {
        return sendError(res, { status: 400, message: req.t('admin.admins.invalidRole') });
      }
      updates.role = role;
    }
    if (password) {
      if (password.length < 8) {
        return sendError(res, { status: 400, message: req.t('admin.admins.weakPassword') });
      }
      updates.passwordHash = await hashPassword(password);
    }

    if (updates.email) {
      const emailOwner = await adminsModel.findByEmail(updates.email);
      if (emailOwner && emailOwner.id !== adminId) {
        return sendError(res, { status: 409, message: req.t('admin.admins.emailExists') });
      }
    }

    const admin = await adminsModel.update(adminId, updates);
    sendSuccess(res, {
      message: req.t('admin.admins.update.success'),
      data: adminsView.formatAdmin(admin),
    });
  }),

  setActive: asyncHandler(async (req, res) => {
    const adminId = Number(req.params.adminId);
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return sendError(res, { status: 400, message: req.t('admin.admins.missingActive') });
    }

    const existing = await adminsModel.findById(adminId);
    if (!existing) {
      return sendError(res, { status: 404, message: req.t('admin.admins.notFound') });
    }

    if (adminId === req.admin.id && !isActive) {
      return sendError(res, { status: 400, message: req.t('admin.admins.cannotDeactivateSelf') });
    }

    if (!isActive && existing.role === 'super_admin') {
      const remaining = await adminsModel.countActiveSuperAdmins(adminId);
      if (remaining === 0) {
        return sendError(res, { status: 400, message: req.t('admin.admins.lastSuperAdmin') });
      }
    }

    const admin = await adminsModel.setActive(adminId, isActive);
    sendSuccess(res, {
      message: isActive
        ? req.t('admin.admins.activate.success')
        : req.t('admin.admins.deactivate.success'),
      data: adminsView.formatAdmin(admin),
    });
  }),
};
