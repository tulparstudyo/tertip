import { sendError } from '../utils/api-response.util.js';

export function errorHandler(err, req, res, _next) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, {
      status: 400,
      message: req.t('user.library.upload.tooLarge'),
    });
  }

  if (err.message === 'INVALID_FILE_TYPE') {
    return sendError(res, {
      status: 400,
      message: req.t('user.library.upload.invalidType'),
    });
  }

  if (err.message === 'INVALID_EXCEL_TYPE') {
    return sendError(res, {
      status: 400,
      message: req.t('user.library.import.invalidType'),
    });
  }

  const status = err.status ?? 500;
  let message = err.message;

  if (message && message.includes('.') && req.t?.(message) !== message) {
    message = req.t(message);
  } else if (status === 500) {
    message = req.t?.('errors.internal') ?? 'Internal server error';
  } else {
    message = message ?? req.t?.('errors.notFound');
  }

  if (status === 500) {
    console.error(err);
  }

  sendError(res, { status, message });
}
