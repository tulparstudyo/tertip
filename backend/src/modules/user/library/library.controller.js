import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import { signStreamGatewayToken, verifyStreamGatewayToken } from '../../../shared/utils/jwt.util.js';
import { uploadFileToLibrary, streamDriveFile } from '../../../shared/services/google-drive.service.js';
import { authModel } from '../auth/auth.model.js';
import { libraryModel } from './library.model.js';
import { libraryView } from './library.view.js';
import { respondToGoogleError } from '../../../shared/utils/google-error.util.js';

export const libraryController = {
  listSources: asyncHandler(async (req, res) => {
    const idsParam = req.query.ids;
    if (idsParam) {
      const ids = String(idsParam)
        .split(',')
        .map((value) => Number(value.trim()))
        .filter(Number.isFinite);
      const rows = await libraryModel.findByIds(req.user.id, ids);

      return sendSuccess(res, {
        message: req.t('user.library.list.success'),
        data: {
          items: libraryView.formatSourceList(rows),
          pagination: {
            page: 1,
            limit: rows.length,
            total: rows.length,
            totalPages: 1,
          },
        },
      });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const q = req.query.q ?? '';
    const sourceType = req.query.sourceType || null;

    const result = await libraryModel.findPagedByUserId(req.user.id, {
      page,
      limit,
      q,
      sourceType,
    });

    sendSuccess(res, {
      message: req.t('user.library.list.success'),
      data: {
        items: libraryView.formatSourceList(result.rows),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
    });
  }),

  getSourceById: asyncHandler(async (req, res) => {
    const row = await libraryModel.findByIdAndUserId(
      Number(req.params.sourceId),
      req.user.id,
    );

    if (!row) {
      return sendError(res, {
        status: 404,
        message: req.t('user.library.get.notFound'),
      });
    }

    sendSuccess(res, { data: libraryView.formatSource(row) });
  }),

  createSource: asyncHandler(async (req, res) => {
    const row = await libraryModel.insert(req.user.id, req.body);
    sendSuccess(res, {
      status: 201,
      message: req.t('user.library.create.success'),
      data: libraryView.formatSource(row),
    });
  }),

  updateSource: asyncHandler(async (req, res) => {
    const sourceId = Number(req.params.sourceId);
    const existing = await libraryModel.findByIdAndUserId(sourceId, req.user.id);

    if (!existing) {
      return sendError(res, {
        status: 404,
        message: req.t('user.library.get.notFound'),
      });
    }

    const row = await libraryModel.updateById(sourceId, req.user.id, req.body);
    sendSuccess(res, {
      message: req.t('user.library.update.success'),
      data: libraryView.formatSource(row),
    });
  }),

  deleteSource: asyncHandler(async (req, res) => {
    const sourceId = Number(req.params.sourceId);
    const deleted = await libraryModel.deleteById(sourceId, req.user.id);

    if (!deleted) {
      return sendError(res, {
        status: 404,
        message: req.t('user.library.get.notFound'),
      });
    }

    sendSuccess(res, { message: req.t('user.library.delete.success') });
  }),

  uploadFile: asyncHandler(async (req, res) => {
    const sourceId = Number(req.params.sourceId);
    const existing = await libraryModel.findByIdAndUserId(sourceId, req.user.id);

    if (!existing) {
      return sendError(res, {
        status: 404,
        message: req.t('user.library.get.notFound'),
      });
    }

    if (!req.file) {
      return sendError(res, {
        status: 400,
        message: req.t('user.library.upload.missingFile'),
      });
    }

    try {
      const uploaded = await uploadFileToLibrary(req.user.id, {
        buffer: req.file.buffer,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
      });

      const row = await libraryModel.updateById(sourceId, req.user.id, {
        googleDriveFileId: uploaded.id,
      });

      sendSuccess(res, {
        message: req.t('user.library.upload.success'),
        data: libraryView.formatSource(row),
      });
    } catch (err) {
      if (await respondToGoogleError(req, res, err, req.user.id)) return;
      throw err;
    }
  }),

  createStreamToken: asyncHandler(async (req, res) => {
    const sourceId = Number(req.params.sourceId);
    const source = await libraryModel.findByIdAndUserId(sourceId, req.user.id);

    if (!source) {
      return sendError(res, {
        status: 404,
        message: req.t('user.library.get.notFound'),
      });
    }

    if (!source.google_drive_file_id) {
      return sendError(res, {
        status: 400,
        message: req.t('user.library.stream.noFile'),
      });
    }

    const gatewayToken = signStreamGatewayToken({
      userId: req.user.id,
      deviceId: req.deviceId,
      sourceId,
      fileId: source.google_drive_file_id,
    });

    sendSuccess(res, {
      data: {
        gatewayToken,
        streamUrl: `/api/v1/user/library/stream/${gatewayToken}`,
        expiresIn: 1800,
      },
    });
  }),

  streamFile: asyncHandler(async (req, res, next) => {
    let payload;
    try {
      payload = verifyStreamGatewayToken(req.params.gatewayToken);
    } catch {
      return sendError(res, {
        status: 401,
        message: req.t('user.library.stream.invalidToken'),
      });
    }

    const session = await authModel.findValidSession(payload.sub, payload.deviceId);
    if (!session) {
      return sendError(res, {
        status: 401,
        message: req.t('user.auth.sessionExpired'),
      });
    }

    try {
      const rangeHeader = req.headers.range;
      const { stream, mimeType, size, name, status } = await streamDriveFile(
        payload.sub,
        payload.fileId,
        rangeHeader,
      );

      res.status(status);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Accept-Ranges', 'bytes');
      if (size) res.setHeader('Content-Length', size);
      res.setHeader('Content-Disposition', `inline; filename="${name}"`);

      stream.on('error', (err) => {
        if (!res.headersSent) {
          next(err);
        }
      });

      stream.pipe(res);
    } catch (err) {
      if (await respondToGoogleError(req, res, err, req.user.id)) return;
      throw err;
    }
  }),
};
