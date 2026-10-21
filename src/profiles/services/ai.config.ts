import { ServiceUnavailableException } from '@nestjs/common';

export type AiProvider = 'openai' | 'openrouter' | 'anthropic' | 'gemini';

export interface AiConfig {
  provider: AiProvider;
  model: string;
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
}

export function getAiConfig(): AiConfig {
  const provider = process.env.AI_PROVIDER?.trim() || 'openai';
  if (provider !== 'openai' && provider !== 'openrouter' && provider !== 'anthropic' && provider !== 'gemini') {
    throw new ServiceUnavailableException('AI_PROVIDER must be openai, openrouter, anthropic or gemini');
  }
  const model = process.env.AI_MODEL?.trim();
  const apiKey = process.env.AI_API_KEY?.trim() ?? '';
  const baseUrl = process.env.AI_API_URL?.trim().replace(/\/+$/, '');
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS ?? 60000);
  if (!model || !baseUrl) {
    throw new ServiceUnavailableException('Configure AI_MODEL and AI_API_URL to process CVs');
  }
  if (provider === 'openrouter' && model !== 'openrouter/free' && !/^[\w.-]+\/[\w.-]+:free$/.test(model)) {
    throw new ServiceUnavailableException('OpenRouter requires openrouter/free or a specific model ending in :free');
  }
  // OpenAI-compatible local servers may run without authentication.
  if (provider !== 'openai' && !apiKey) {
    throw new ServiceUnavailableException('Configure AI_API_KEY to process CVs');
  }
  try {
    const url = new URL(baseUrl);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new Error('Invalid URL');
    }
  } catch {
    throw new ServiceUnavailableException('AI_API_URL must be an HTTP(S) base URL without credentials, query or fragment');
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 300000) {
    throw new ServiceUnavailableException('AI_TIMEOUT_MS must be an integer between 1 and 300000');
  }
  return { provider, model, apiKey, baseUrl, timeoutMs };
}
