import { randomUUID } from 'crypto';
import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import { projectModel } from './project.model.js';
import { commentModel } from './comment.model.js';
import { commentView } from './comment.view.js';

export const commentController = {
  listComments: asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    const access = await projectModel.findAccessibleProject(projectId, req.user.id);

    if (!access) {
      return sendError(res, { status: 404, message: req.t('user.project.get.notFound') });
    }

    const rows = await commentModel.findByProjectId(projectId);
    sendSuccess(res, { data: commentView.formatCommentList(rows) });
  }),

  createComment: asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    const access = await projectModel.findAccessibleProject(projectId, req.user.id);

    if (!access) {
      return sendError(res, { status: 404, message: req.t('user.project.get.notFound') });
    }

    const { commentText, lineNumber, columnOffset, tiptapCommentId } = req.body;

    if (!commentText?.trim() || lineNumber == null || columnOffset == null) {
      return sendError(res, { status: 400, message: req.t('user.comment.missingFields') });
    }

    const row = await commentModel.insert({
      projectId,
      userId: req.user.id,
      tiptapCommentId: tiptapCommentId ?? randomUUID(),
      commentText: commentText.trim(),
      lineNumber: Number(lineNumber),
      columnOffset: Number(columnOffset),
    });

    sendSuccess(res, {
      status: 201,
      message: req.t('user.comment.create.success'),
      data: commentView.formatComment({ ...row, user_name: req.user.name }),
    });
  }),

  resolveComment: asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    const commentId = Number(req.params.commentId);
    const access = await projectModel.findAccessibleProject(projectId, req.user.id);

    if (!access?.isOwner) {
      return sendError(res, { status: 403, message: req.t('user.comment.resolve.forbidden') });
    }

    const row = await commentModel.resolve(commentId, projectId);
    if (!row) {
      return sendError(res, { status: 404, message: req.t('user.comment.notFound') });
    }

    sendSuccess(res, { message: req.t('user.comment.resolve.success') });
  }),
};
