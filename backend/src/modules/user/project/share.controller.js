import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import { projectModel } from './project.model.js';
import { shareModel } from './share.model.js';
import { shareView } from './share.view.js';

export const shareController = {
  listShares: asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    const project = await projectModel.findByIdAndUserId(projectId, req.user.id);

    if (!project) {
      return sendError(res, { status: 404, message: req.t('user.project.get.notFound') });
    }

    const rows = await shareModel.findByProjectId(projectId);
    sendSuccess(res, { data: shareView.formatShareList(rows) });
  }),

  createShare: asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    const project = await projectModel.findByIdAndUserId(projectId, req.user.id);

    if (!project) {
      return sendError(res, { status: 404, message: req.t('user.project.get.notFound') });
    }

    const { email } = req.body;
    if (!email?.trim()) {
      return sendError(res, { status: 400, message: req.t('user.share.missingEmail') });
    }

    const target = await shareModel.findUserByEmail(email);
    if (!target) {
      return sendError(res, { status: 404, message: req.t('user.share.userNotFound') });
    }

    if (target.id === req.user.id) {
      return sendError(res, { status: 400, message: req.t('user.share.selfShare') });
    }

    const row = await shareModel.create({
      projectId,
      sharedByUserId: req.user.id,
      sharedWithUserId: target.id,
    });

    if (!row) {
      return sendError(res, { status: 409, message: req.t('user.share.alreadyShared') });
    }

    sendSuccess(res, {
      status: 201,
      message: req.t('user.share.create.success'),
      data: shareView.formatShare({ ...row, email: target.email, name: target.name }),
    });
  }),

  deleteShare: asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    const shareId = Number(req.params.shareId);
    const deleted = await shareModel.deleteShare(projectId, shareId, req.user.id);

    if (!deleted) {
      return sendError(res, { status: 404, message: req.t('user.share.notFound') });
    }

    sendSuccess(res, { message: req.t('user.share.delete.success') });
  }),
};
