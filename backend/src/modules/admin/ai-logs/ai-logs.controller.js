import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import { aiCommandLogModel } from '../../user/ai/ai-command-log.model.js';
import { AI_COMMAND_TYPE_LIST } from '../../../shared/constants/ai-command-types.constants.js';
import { aiLogsView } from './ai-logs.view.js';

const VALID_STATUSES = ['success', 'failure'];

export const aiLogsController = {
  listCommandTypes: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: { commandTypes: AI_COMMAND_TYPE_LIST } });
  }),

  list: asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const userId = req.query.userId ? Number(req.query.userId) : null;
    const projectId = req.query.projectId ? Number(req.query.projectId) : null;
    const commandType = AI_COMMAND_TYPE_LIST.includes(req.query.commandType)
      ? req.query.commandType
      : null;
    const status = VALID_STATUSES.includes(req.query.status) ? req.query.status : null;
    const dateFrom = req.query.dateFrom || null;
    const dateTo = req.query.dateTo || null;
    const q = req.query.q ?? '';

    const result = await aiCommandLogModel.findPaged({
      page,
      limit,
      userId: Number.isFinite(userId) ? userId : null,
      projectId: Number.isFinite(projectId) ? projectId : null,
      commandType,
      status,
      dateFrom,
      dateTo,
      q,
    });

    sendSuccess(res, {
      message: req.t('admin.aiLogs.list.success'),
      data: {
        items: aiLogsView.formatLogList(result.rows),
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
    const log = await aiCommandLogModel.findById(Number(req.params.logId));
    if (!log) {
      return sendError(res, { status: 404, message: req.t('admin.aiLogs.notFound') });
    }
    sendSuccess(res, { data: aiLogsView.formatLog(log) });
  }),
};
