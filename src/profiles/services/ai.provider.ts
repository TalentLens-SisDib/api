import { BadGatewayException, GatewayTimeoutException } from '@nestjs/common';
import type { AiConfig } from './ai.config.js';
import { PROFILE_RESPONSE_FORMAT } from './ai.profile-schema.js';

interface ProviderRequest {
  url: string;
  headers: Record<string, string>;
  body: unknown;
  readText: (response: unknown) => string;
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function textBlocks(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value.map((part: unknown) => {
    const block = record(part);
    return typeof block.text === 'string' ? block.text : '';
  }).join('');
}

function buildRequest(config: AiConfig, instructions: string, text: string): ProviderRequest {
  const { baseUrl, apiKey, model } = config;
  switch (config.provider) {
    case 'openai':
    case 'openrouter':
      return {
        url: `${baseUrl}/chat/completions`,
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        body: {
          model,
          ...(config.provider === 'openrouter' && {
            response_format: PROFILE_RESPONSE_FORMAT,
            // Do not allow endpoints to silently ignore the profile schema.
            provider: { require_parameters: true },
          }),
          messages: [
            { role: 'system', content: instructions },
            { role: 'user', content: text },
          ],
        },
        readText: (response) => {
          const choices = record(response).choices;
          const choice = record(Array.isArray(choices) ? choices[0] : undefined);
          if (choice.finish_reason && choice.finish_reason !== 'stop') return '';
          const content = record(choice.message).content;
          return typeof content === 'string' ? content : '';
        },
      };
    case 'anthropic':
      return {
        url: `${baseUrl}/messages`,
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: { model, max_tokens: 2048, system: instructions, messages: [{ role: 'user', content: text }] },
        readText: (response) => {
          const result = record(response);
          if (result.stop_reason && result.stop_reason !== 'end_turn') return '';
          const blocks = Array.isArray(result.content)
            ? result.content.filter((part: unknown) => record(part).type === 'text')
            : [];
          return textBlocks(blocks);
        },
      };
    case 'gemini':
      return {
        url: `${baseUrl}/models/${encodeURIComponent(model.replace(/^models\//, ''))}:generateContent`,
        headers: { 'x-goog-api-key': apiKey },
        body: {
          systemInstruction: { parts: [{ text: instructions }] },
          contents: [{ role: 'user', parts: [{ text }] }],
          generationConfig: { responseMimeType: 'application/json' },
        },
        readText: (response) => {
          const candidates = record(response).candidates;
          const candidate = record(Array.isArray(candidates) ? candidates[0] : undefined);
          if (candidate.finishReason && candidate.finishReason !== 'STOP') return '';
          const parts = record(candidate.content).parts;
          return textBlocks(Array.isArray(parts)
            ? parts.filter((part: unknown) => record(part).thought !== true)
            : []);
        },
      };
  }
}

export async function generateProfile(config: AiConfig, instructions: string, text: string): Promise<string> {
  const request = buildRequest(config, instructions, text);
  const signal = AbortSignal.timeout(config.timeoutMs);
  try {
    const response = await fetch(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...request.headers },
      body: JSON.stringify(request.body),
      signal,
    });
    if (!response.ok) {
      // Provider bodies can contain credentials or CV data; never expose them.
      throw new BadGatewayException(`AI provider returned HTTP ${response.status}`);
    }
    const result = request.readText(await response.json());
    if (!result.trim()) throw new BadGatewayException('AI provider returned no complete text response');
    return result;
  } catch (error) {
    if (signal.aborted) throw new GatewayTimeoutException('AI provider request timed out');
    if (error instanceof BadGatewayException) throw error;
    throw new BadGatewayException('Unable to read a response from the AI provider');
  }
}
