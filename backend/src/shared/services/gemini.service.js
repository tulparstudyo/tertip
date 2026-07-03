import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';
import { normalizeGeminiError } from '../utils/ai-error.util.js';

let client = null;

function getClient() {
  if (!env.geminiApiKey) {
    throw new Error('GEMINI_NOT_CONFIGURED');
  }
  if (!client) {
    client = new GoogleGenerativeAI(env.geminiApiKey);
  }
  return client;
}

export async function runGemini({ model, systemInstruction, parts, jsonMode = false }) {
  const genAI = getClient();
  const generativeModel = genAI.getGenerativeModel({
    model: model ?? env.geminiModelFlash,
    systemInstruction,
    ...(jsonMode
      ? { generationConfig: { responseMimeType: 'application/json' } }
      : {}),
  });

  try {
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts }],
    });

    const text = result.response.text()?.trim() ?? '';
    const usage = result.response.usageMetadata;
    const tokensUsed =
      (usage?.promptTokenCount ?? 0) + (usage?.candidatesTokenCount ?? 0);

    return { text, tokensUsed: tokensUsed || Math.ceil(text.length / 4) };
  } catch (err) {
    throw normalizeGeminiError(err);
  }
}

export function localeInstruction(locale) {
  return locale === 'en'
    ? 'Respond strictly in English.'
    : 'Yanıtı kesinlikle Türkçe ver.';
}
