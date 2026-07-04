import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import { uploadFileToLibrary, deleteDriveFile } from '../../../shared/services/google-drive.service.js';
import { signStreamGatewayToken } from '../../../shared/utils/jwt.util.js';
import { respondToGoogleError } from '../../../shared/utils/google-error.util.js';
import { projectModel } from './project.model.js';
import { citationImageModel } from './citation-image.model.js';
import { citationImageView } from './citation-image.view.js';
import { libraryModel } from '../library/library.model.js';
import { libraryView } from '../library/library.view.js';
import { formatTurkishFootnoteFull } from '../../../shared/utils/turkish-footnote.util.js';

function parseNewSource(raw) {
  if (!raw) return null;
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data?.title?.trim()) return null;
    return data;
  } catch {
    return null;
  }
}

function parsePageNumber(raw) {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

async function resolveProjectAccess(req, res) {
  const projectId = Number(req.params.projectId);
  const access = await projectModel.findAccessibleProject(projectId, req.user.id);
  if (!access) {
    sendError(res, { status: 404, message: req.t('user.project.get.notFound') });
    return null;
  }
  if (!access.isOwner) {
    sendError(res, { status: 403, message: req.t('user.project.content.readOnly') });
    return null;
  }
  return { projectId, access };
}

async function resolveSourceId(req, userId, bodySourceId, newSourceRaw) {
  const parsedId = Number(bodySourceId);
  if (Number.isFinite(parsedId) && parsedId > 0) {
    const existing = await libraryModel.findByIdAndUserId(parsedId, userId);
    if (!existing) throw new Error('SOURCE_NOT_FOUND');
    return parsedId;
  }

  const newSource = parseNewSource(newSourceRaw);
  if (!newSource) return null;

  const row = await libraryModel.insert(userId, newSource);
  return row.id;
}

async function resolveCitationText(userId, sourceId, pageNumber, rawCitation) {
  const trimmed = String(rawCitation ?? '').trim();
  if (trimmed) return trimmed;

  const sourceRow = await libraryModel.findByIdAndUserId(sourceId, userId);
  if (!sourceRow) return '';
  return formatTurkishFootnoteFull(libraryView.formatSource(sourceRow), pageNumber);
}

export const citationImageController = {
  create: asyncHandler(async (req, res) => {
    const ctx = await resolveProjectAccess(req, res);
    if (!ctx) return;

    if (!req.file) {
      return sendError(res, {
        status: 400,
        message: req.t('user.citationImage.missingImage'),
      });
    }

    let sourceId = null;
    try {
      sourceId = await resolveSourceId(
        req,
        req.user.id,
        req.body.sourceId,
        req.body.newSource,
      );
    } catch {
      return sendError(res, {
        status: 400,
        message: req.t('user.citationImage.sourceNotFound'),
      });
    }

    if (!sourceId) {
      return sendError(res, {
        status: 400,
        message: req.t('user.citationImage.sourceRequired'),
      });
    }

    const pageNumber = parsePageNumber(req.body.pageNumber);
    if (!pageNumber) {
      return sendError(res, {
        status: 400,
        message: req.t('user.citationImage.pageRequired'),
      });
    }

    const citationText = await resolveCitationText(
      req.user.id,
      sourceId,
      pageNumber,
      req.body.citationText,
    );

    const ocrText = String(req.body.ocrText ?? '').trim();

    try {
      const uploaded = await uploadFileToLibrary(req.user.id, {
        buffer: req.file.buffer,
        filename: req.file.originalname || `citation-${Date.now()}.jpg`,
        mimeType: req.file.mimetype,
        projectFolderId: ctx.access.project.google_drive_folder_id,
      });

      const row = await citationImageModel.insert({
        projectId: ctx.projectId,
        userId: req.user.id,
        sourceId,
        googleDriveFileId: uploaded.id,
        ocrText,
        citationText,
        pageNumber,
        mimeType: req.file.mimetype,
        originalFilename: req.file.originalname,
      });

      sendSuccess(res, {
        status: 201,
        message: req.t('user.citationImage.created'),
        data: {
          ...citationImageView.format(row),
          formattedText: citationText,
        },
      });
    } catch (err) {
      if (await respondToGoogleError(req, res, err, req.user.id)) return;
      throw err;
    }
  }),

  getById: asyncHandler(async (req, res) => {
    const ctx = await resolveProjectAccess(req, res);
    if (!ctx) return;

    const id = Number(req.params.citationImageId);
    const row = await citationImageModel.findByIdAndProject(id, ctx.projectId, req.user.id);
    if (!row) {
      return sendError(res, {
        status: 404,
        message: req.t('user.citationImage.notFound'),
      });
    }

    sendSuccess(res, {
      data: {
        ...citationImageView.format(row),
        formattedText: row.citation_text ?? '',
      },
    });
  }),

  update: asyncHandler(async (req, res) => {
    const ctx = await resolveProjectAccess(req, res);
    if (!ctx) return;

    const id = Number(req.params.citationImageId);
    const existing = await citationImageModel.findByIdAndProject(
      id,
      ctx.projectId,
      req.user.id,
    );
    if (!existing) {
      return sendError(res, {
        status: 404,
        message: req.t('user.citationImage.notFound'),
      });
    }

    let sourceId = existing.source_id;
    if (req.body.sourceId !== undefined || req.body.newSource) {
      try {
        sourceId = await resolveSourceId(
          req,
          req.user.id,
          req.body.sourceId,
          req.body.newSource,
        );
      } catch {
        return sendError(res, {
          status: 400,
          message: req.t('user.citationImage.sourceNotFound'),
        });
      }
    }

    if (!sourceId) {
      return sendError(res, {
        status: 400,
        message: req.t('user.citationImage.sourceRequired'),
      });
    }

    const pageNumber =
      req.body.pageNumber !== undefined
        ? parsePageNumber(req.body.pageNumber)
        : existing.page_number;

    if (!pageNumber) {
      return sendError(res, {
        status: 400,
        message: req.t('user.citationImage.pageRequired'),
      });
    }

    const citationText = await resolveCitationText(
      req.user.id,
      sourceId,
      pageNumber,
      req.body.citationText !== undefined ? req.body.citationText : existing.citation_text,
    );

    const ocrText =
      req.body.ocrText !== undefined ? String(req.body.ocrText).trim() : undefined;

    const row = await citationImageModel.updateById(id, ctx.projectId, req.user.id, {
      sourceId,
      ocrText,
      citationText,
      pageNumber,
    });

    sendSuccess(res, {
      message: req.t('user.citationImage.updated'),
      data: {
        ...citationImageView.format(row),
        formattedText: row.citation_text ?? '',
      },
    });
  }),

  createStreamToken: asyncHandler(async (req, res) => {
    const ctx = await resolveProjectAccess(req, res);
    if (!ctx) return;

    const id = Number(req.params.citationImageId);
    const row = await citationImageModel.findByIdAndProject(id, ctx.projectId, req.user.id);
    if (!row) {
      return sendError(res, {
        status: 404,
        message: req.t('user.citationImage.notFound'),
      });
    }

    const gatewayToken = signStreamGatewayToken({
      userId: req.user.id,
      deviceId: req.deviceId,
      sourceId: id,
      fileId: row.google_drive_file_id,
    });

    sendSuccess(res, {
      data: {
        gatewayToken,
        streamUrl: `/user/library/stream/${gatewayToken}`,
        expiresIn: 1800,
      },
    });
  }),

  remove: asyncHandler(async (req, res) => {
    const ctx = await resolveProjectAccess(req, res);
    if (!ctx) return;

    const id = Number(req.params.citationImageId);
    const existing = await citationImageModel.findByIdAndProject(id, ctx.projectId, req.user.id);
    if (!existing) {
      return sendError(res, {
        status: 404,
        message: req.t('user.citationImage.notFound'),
      });
    }

    try {
      if (existing.google_drive_file_id) {
        await deleteDriveFile(req.user.id, existing.google_drive_file_id);
      }
    } catch (err) {
      return respondToGoogleError(req, res, err);
    }

    await citationImageModel.deleteById(id, ctx.projectId, req.user.id);

    sendSuccess(res, { message: req.t('user.citationImage.deleted') });
  }),
};
