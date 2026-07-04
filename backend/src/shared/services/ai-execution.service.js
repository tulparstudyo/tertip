import { runGemini } from './gemini.service.js';
import { aiModel } from '../../modules/user/ai/ai.model.js';
import { aiCommandLogModel } from '../../modules/user/ai/ai-command-log.model.js';

export async function executeAiCommand({
  userId,
  projectId = null,
  commandType,
  model,
  systemInstruction,
  parts,
  jsonMode = false,
}) {
  await aiModel.consumeCommand(userId);

  try {
    const { text, tokensUsed } = await runGemini({
      model,
      systemInstruction,
      parts,
      jsonMode,
    });

    await aiCommandLogModel.insert({
      userId,
      projectId,
      commandType,
      tokensUsed,
      status: 'success',
    });

    return { text, tokensUsed };
  } catch (err) {
    await aiCommandLogModel.insert({
      userId,
      projectId,
      commandType,
      tokensUsed: 0,
      status: 'failure',
      errorMessage: err.message,
    });
    throw err;
  }
}
