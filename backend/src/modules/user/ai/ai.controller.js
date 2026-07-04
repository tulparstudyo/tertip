import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import { localeInstruction } from '../../../shared/services/gemini.service.js';
import { executeAiCommand } from '../../../shared/services/ai-execution.service.js';
import { handleAiError } from '../../../shared/utils/ai-error.util.js';
import { AI_COMMAND_TYPES, AI_COMMAND_TYPE_LIST } from '../../../shared/constants/ai-command-types.constants.js';
import { aiCommandLogModel } from './ai-command-log.model.js';
import { aiView } from './ai.view.js';

function imagePartFromFile(file) {
  return {
    inlineData: {
      mimeType: file.mimetype,
      data: file.buffer.toString('base64'),
    },
  };
}

function parseProjectId(value) {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

const VALID_LOG_STATUSES = ['success', 'failure'];

export const aiController = {
  listCommandTypes: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: { commandTypes: AI_COMMAND_TYPE_LIST } });
  }),

  listLogs: asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const projectId = req.query.projectId ? Number(req.query.projectId) : null;
    const commandType = AI_COMMAND_TYPE_LIST.includes(req.query.commandType)
      ? req.query.commandType
      : null;
    const status = VALID_LOG_STATUSES.includes(req.query.status) ? req.query.status : null;
    const dateFrom = req.query.dateFrom || null;
    const dateTo = req.query.dateTo || null;

    const result = await aiCommandLogModel.findPaged({
      page,
      limit,
      userId: req.user.id,
      projectId: Number.isFinite(projectId) ? projectId : null,
      commandType,
      status,
      dateFrom,
      dateTo,
    });

    sendSuccess(res, {
      message: req.t('user.ai.logs.list.success'),
      data: {
        items: aiView.formatLogList(result.rows),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
    });
  }),

  getLog: asyncHandler(async (req, res) => {
    const log = await aiCommandLogModel.findByIdForUser(
      Number(req.params.logId),
      req.user.id,
    );
    if (!log) {
      return sendError(res, { status: 404, message: req.t('user.ai.logs.notFound') });
    }
    sendSuccess(res, { data: aiView.formatLog(log) });
  }),

  voiceToAcademic: asyncHandler(async (req, res) => {
    if (!req.file) {
      return sendError(res, { status: 400, message: req.t('user.ai.missingAudio') });
    }

    const projectType = req.body.projectType ?? 'article';
    const locale = req.locale ?? 'tr';
    const projectId = parseProjectId(req.body.projectId);
    const systemInstruction = `You are an advanced academic transcription engine. Listen to the audio. Transcribe it perfectly, but eliminate filler words. Restructure informal speech into rigorous academic tone suitable for a ${projectType}. ${localeInstruction(locale)} Return ONLY the final polished text.`;

    try {
      const { text } = await executeAiCommand({
        userId: req.user.id,
        projectId,
        commandType: AI_COMMAND_TYPES.VOICE_TO_ACADEMIC,
        systemInstruction,
        parts: [
          {
            inlineData: {
              mimeType: req.file.mimetype,
              data: req.file.buffer.toString('base64'),
            },
          },
        ],
      });
      sendSuccess(res, { data: { text } });
    } catch (err) {
      if (!handleAiError(err, req, res)) throw err;
    }
  }),

  screenshotOcr: asyncHandler(async (req, res) => {
    if (!req.file) {
      return sendError(res, { status: 400, message: req.t('user.ai.missingImage') });
    }

    const projectId = parseProjectId(req.body.projectId);
    const systemInstruction =
      'You are an advanced academic OCR engine. Extract all readable text from the provided image. Do not add comments or markdown. Maintain paragraph structure. Output strictly the raw extracted text.';

    try {
      const { text } = await executeAiCommand({
        userId: req.user.id,
        projectId,
        commandType: AI_COMMAND_TYPES.SCREENSHOT_OCR,
        systemInstruction,
        parts: [imagePartFromFile(req.file)],
      });
      sendSuccess(res, { data: { text, projectId } });
    } catch (err) {
      if (!handleAiError(err, req, res)) throw err;
    }
  }),

  screenshotOcrOttoman: asyncHandler(async (req, res) => {
    if (!req.file) {
      return sendError(res, { status: 400, message: req.t('user.ai.missingImage') });
    }

    const projectId = parseProjectId(req.body.projectId);
    const systemInstruction =
      'You are an expert in Ottoman Turkish paleography and transcription. The image contains text written in Ottoman Turkish (Arabic/Persian script). Read the text carefully and transcribe it into modern Turkish using the Latin alphabet with standard Turkish orthography. Apply accepted transliteration rules for Ottoman Turkish. Do not add comments, explanations, or markdown. Preserve paragraph and line breaks. Output strictly the transcribed Latin-alphabet text only.';

    try {
      const { text } = await executeAiCommand({
        userId: req.user.id,
        projectId,
        commandType: AI_COMMAND_TYPES.SCREENSHOT_OCR_OTTOMAN,
        systemInstruction,
        parts: [imagePartFromFile(req.file)],
      });
      sendSuccess(res, { data: { text, projectId } });
    } catch (err) {
      if (!handleAiError(err, req, res)) throw err;
    }
  }),

  rewriteGrammar: asyncHandler(async (req, res) => {
    const { selectedText, projectType = 'article' } = req.body;

    if (!selectedText?.trim()) {
      return sendError(res, { status: 400, message: req.t('user.ai.missingText') });
    }

    const locale = req.locale ?? 'tr';
    const projectId = parseProjectId(req.body.projectId);
    const langNote = locale === 'en'
      ? 'Write change notes (note field) in English.'
      : 'Değişiklik açıklamalarını (note alanı) Türkçe yaz.';

    const systemInstruction = `You are an expert academic proofreader for ${projectType} texts.
Review the user's selected text for:
1. Grammar and syntax (category: "grammar")
2. Spelling and orthography rules (category: "spelling")
3. Expression and clarity issues, including anlatım bozuklukları (category: "expression")

Preserve the original meaning and academic tone. Fix only what needs correction.
${localeInstruction(locale)}
${langNote}

Return ONLY valid JSON with this exact shape:
{
  "text": "the fully corrected text",
  "changes": [
    {
      "category": "grammar" | "spelling" | "expression",
      "original": "short excerpt from the original",
      "revised": "corrected excerpt",
      "note": "brief explanation of the fix"
    }
  ]
}
If the text needs no changes, return the original in "text" and an empty "changes" array.`;

    try {
      const { text: raw } = await executeAiCommand({
        userId: req.user.id,
        projectId,
        commandType: AI_COMMAND_TYPES.REWRITE_GRAMMAR,
        systemInstruction,
        parts: [{ text: selectedText }],
        jsonMode: true,
      });

      let parsed = { text: selectedText.trim(), changes: [] };
      try {
        const data = JSON.parse(raw);
        parsed = {
          text: String(data.text ?? selectedText).trim(),
          changes: Array.isArray(data.changes) ? data.changes : [],
        };
      } catch {
        parsed = { text: raw.trim() || selectedText.trim(), changes: [] };
      }

      sendSuccess(res, { data: parsed });
    } catch (err) {
      if (!handleAiError(err, req, res)) throw err;
    }
  }),
};
