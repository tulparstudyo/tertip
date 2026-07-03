export function sendSuccess(res, { status = 200, message, data } = {}) {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== undefined) body.data = data;
  res.status(status).json(body);
}

export function sendError(res, { status = 400, message } = {}) {
  res.status(status).json({ success: false, message });
}
