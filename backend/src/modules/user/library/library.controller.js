import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import { signStreamGatewayToken, verifyStreamGatewayToken } from '../../../shared/utils/jwt.util.js';
import { uploadFileToLibrary, streamDriveFile } from '../../../shared/services/google-drive.service.js';
import { projectModel } from '../project/project.model.js';
import { authModel } from '../auth/auth.model.js';
import { libraryModel } from './library.model.js';
import { libraryView } from './library.view.js';
import { respondToGoogleError } from '../../../shared/utils/google-error.util.js';
import {
  buildLibraryExcelBuffer,
  buildMatchIndex,
  buildSourceMatchKey,
  parseLibraryExcelBuffer,
} from '../../../shared/services/library-excel.service.js';

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
      let projectFolderId = null;
      const projectId = Number(req.body.projectId ?? req.query.projectId);
      if (Number.isFinite(projectId) && projectId > 0) {
        const access = await projectModel.findAccessibleProject(projectId, req.user.id);
        if (access?.isOwner) {
          projectFolderId = access.project.google_drive_folder_id;
        }
      }

      const uploaded = await uploadFileToLibrary(req.user.id, {
        buffer: req.file.buffer,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        projectFolderId,
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

  exportSourcesExcel: asyncHandler(async (req, res) => {
    const rows = await libraryModel.findAllByUserId(req.user.id);
    const buffer = buildLibraryExcelBuffer(rows);
    const filename = `tertip-kutuphane-${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }),

  importSourcesExcel: asyncHandler(async (req, res) => {
    if (!req.file) {
      return sendError(res, {
        status: 400,
        message: req.t('user.library.import.missingFile'),
      });
    }

    let records;
    try {
      records = parseLibraryExcelBuffer(req.file.buffer);
    } catch (err) {
      const code = err.message ?? 'PARSE_FAILED';
      const messageKey = {
        EMPTY_WORKBOOK: 'user.library.import.emptyWorkbook',
        EMPTY_SHEET: 'user.library.import.emptySheet',
        MISSING_TITLE_COLUMN: 'user.library.import.missingTitleColumn',
      }[code];
      return sendError(res, {
        status: 400,
        message: messageKey ? req.t(messageKey) : req.t('user.library.import.parseFailed'),
      });
    }

    if (!records.length) {
      return sendError(res, {
        status: 400,
        message: req.t('user.library.import.noRows'),
      });
    }

    const existingRows = await libraryModel.findAllByUserId(req.user.id);
    const matchIndex = buildMatchIndex(existingRows);

    let inserted = 0;
    let updated = 0;

    for (const payload of records) {
      const key = buildSourceMatchKey(payload);
      const existing = matchIndex.get(key);

      if (existing) {
        await libraryModel.replaceFromImport(existing.id, req.user.id, payload);
        updated += 1;
        matchIndex.set(key, { ...existing, ...payload });
      } else {
        const row = await libraryModel.insert(req.user.id, payload);
        inserted += 1;
        matchIndex.set(key, row);
      }
    }

    sendSuccess(res, {
      message: req
        .t('user.library.import.success')
        .replace('{inserted}', String(inserted))
        .replace('{updated}', String(updated)),
      data: { inserted, updated, total: records.length },
    });
  }),
};
