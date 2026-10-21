import { BadGatewayException, BadRequestException, GatewayTimeoutException, ServiceUnavailableException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAiConfig } from './ai.config.js';
import { generateProfile } from './ai.provider.js';
import { AiService, MAX_CV_BYTES } from './ai.service.js';

// Minimal real PDF: exercises extraction rather than mocking the PDF parser.
function pdf(text: string): Express.Multer.File {
  const stream = `BT /F1 12 Tf 50 750 Td (${text}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let document = '%PDF-1.4\n';
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(document));
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(document);
  document += 'xref\n0 6\n0000000000 65535 f \n';
  document += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  document += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return { buffer: Buffer.from(document), mimetype: 'application/pdf', originalname: 'cv.pdf' } as Express.Multer.File;
}

const profile = { name: 'Ana Silva', description: 'Desenvolvedora', skills: ['TypeScript'] };
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('AI_PROVIDER', 'openai');
  vi.stubEnv('AI_MODEL', 'test-model');
  vi.stubEnv('AI_API_KEY', 'test-secret');
  vi.stubEnv('AI_API_URL', 'https://provider.example/v1/');
  vi.stubEnv('AI_TIMEOUT_MS', '60000');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('AI configuration', () => {
  it('accepts the OpenRouter free pool and specific free variants', () => {
    vi.stubEnv('AI_PROVIDER', 'openrouter');
    for (const model of ['openrouter/free', 'vendor/model:free']) {
      vi.stubEnv('AI_MODEL', model);
      expect(getAiConfig().model).toBe(model);
    }
  });
  it.each(['openrouter/auto', 'vendor/paid-model', 'vendor/model:free,other/paid'])('rejects paid or ambiguous OpenRouter models: %s', (model) => {
    vi.stubEnv('AI_PROVIDER', 'openrouter');
    vi.stubEnv('AI_MODEL', model);
    expect(getAiConfig).toThrow(ServiceUnavailableException);
  });
  it('requires an OpenRouter API key', () => {
    vi.stubEnv('AI_PROVIDER', 'openrouter');
    vi.stubEnv('AI_MODEL', 'openrouter/free');
    vi.stubEnv('AI_API_KEY', '');
    expect(getAiConfig).toThrow(ServiceUnavailableException);
  });
  it.each(['AI_MODEL', 'AI_API_URL'])('rejects missing %s', (key) => {
    vi.stubEnv(key, '');
    expect(getAiConfig).toThrow(ServiceUnavailableException);
  });
  it.each(['ftp://host', 'https://user:secret@host', 'https://host?key=secret'])('rejects unsafe URL %s', (url) => {
    vi.stubEnv('AI_API_URL', url);
    expect(getAiConfig).toThrow(ServiceUnavailableException);
  });
  it('rejects unsupported protocols and invalid timeouts', () => {
    vi.stubEnv('AI_PROVIDER', 'unknown');
    expect(getAiConfig).toThrow(ServiceUnavailableException);
    vi.stubEnv('AI_PROVIDER', 'openai');
    vi.stubEnv('AI_TIMEOUT_MS', 'NaN');
    expect(getAiConfig).toThrow(ServiceUnavailableException);
  });
  it('allows keyless local compatible servers but requires keys for native providers', () => {
    vi.stubEnv('AI_API_KEY', '');
    expect(getAiConfig().apiKey).toBe('');
    vi.stubEnv('AI_PROVIDER', 'anthropic');
    expect(getAiConfig).toThrow(ServiceUnavailableException);
  });
});

describe('CV import', () => {
  it('uses the OpenRouter free router with JSON output and no paid fallbacks', async () => {
    vi.stubEnv('AI_PROVIDER', 'openrouter');
    vi.stubEnv('AI_MODEL', 'openrouter/free');
    vi.stubEnv('AI_API_URL', 'https://openrouter.ai/api/v1');
    fetchMock.mockResolvedValue(Response.json({ choices: [{ message: { content: JSON.stringify(profile) } }] }));
    expect(await new AiService().parsePdf(pdf('Ana Silva - TypeScript'))).toEqual(profile);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(options?.headers).toMatchObject({ Authorization: 'Bearer test-secret' });
    const body = JSON.parse(options?.body as string);
    expect(body.model).toBe('openrouter/free');
    expect(body.provider).toEqual({ require_parameters: true });
    expect(body.response_format).toMatchObject({
      type: 'json_schema',
      json_schema: {
        name: 'applicant_profile',
        strict: true,
        schema: {
          additionalProperties: false,
          required: ['name', 'description', 'skills', 'educationalBackground'],
        },
      },
    });
    expect(body.models).toBeUndefined();
  });
  it.each([
    { provider: 'openai', path: '/chat/completions', header: 'Authorization', key: 'Bearer test-secret', response: { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(profile) } }] } },
    { provider: 'anthropic', path: '/messages', header: 'x-api-key', key: 'test-secret', response: { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(profile) }] } },
    { provider: 'gemini', path: '/models/test-model:generateContent', header: 'x-goog-api-key', key: 'test-secret', response: { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(profile) }] } }] } },
  ])('extracts a real PDF and maps the $provider response', async ({ provider, path, header, key, response }) => {
    vi.stubEnv('AI_PROVIDER', provider);
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response)));
    expect(await new AiService().parsePdf(pdf('Ana Silva - TypeScript'))).toEqual(profile);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://provider.example/v1${path}`);
    expect(options?.headers).toMatchObject({ [header]: key });
    const body = JSON.parse(options?.body as string);
    expect(JSON.stringify(body)).toContain('Ana Silva - TypeScript');
    if (provider !== 'gemini') expect(body.model).toBe('test-model');
  });

  it('normalizes fenced JSON, whitespace and duplicate skills', async () => {
    fetchMock.mockResolvedValue(Response.json({ choices: [{ message: { content: '```json\n{"name":" Ana ","skills":[" React ","React",""]}\n```' } }] }));
    expect(await new AiService().parsePdf(pdf('Ana - React'))).toEqual({ name: 'Ana', skills: ['React'] });
  });

  it('rejects a safety classification instead of accepting it as a profile', async () => {
    vi.stubEnv('AI_PROVIDER', 'openrouter');
    vi.stubEnv('AI_MODEL', 'openrouter/free');
    fetchMock.mockResolvedValue(Response.json({
      choices: [{ message: { content: 'User Safety: safe' } }],
    }));
    await expect(new AiService().parsePdf(pdf('Ana - React')))
      .rejects.toThrow('AI provider returned invalid JSON');
  });

  it.each(['not json', '[]', '{"name":" "}', '{"name":"Ana","skills":[1]}', '{"name":"Ana","role":"Admin"}', JSON.stringify({ name: 'Ana', description: 'x'.repeat(2001) })])('rejects invalid profile output: %s', async (content) => {
    fetchMock.mockResolvedValue(Response.json({ choices: [{ message: { content } }] }));
    await expect(new AiService().parsePdf(pdf('Ana'))).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('rejects invalid or oversized files without contacting a provider', async () => {
    for (const file of [
      { ...pdf('Ana'), mimetype: 'text/plain' },
      { ...pdf('Ana'), buffer: Buffer.from('not a PDF') },
      { ...pdf('Ana'), buffer: Buffer.alloc(MAX_CV_BYTES + 1) },
      { ...pdf('Ana'), buffer: Buffer.from('%PDF-broken') },
    ]) {
      await expect(new AiService().parsePdf(file)).rejects.toBeInstanceOf(BadRequestException);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects PDFs without readable text', async () => {
    await expect(new AiService().parsePdf(pdf(''))).rejects.toBeInstanceOf(BadRequestException);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('provider errors', () => {
  it('does not expose provider error bodies', async () => {
    fetchMock.mockResolvedValue(new Response('test-secret and private CV', { status: 401 }));
    await expect(generateProfile(getAiConfig(), 'instructions', 'cv')).rejects.toThrow('AI provider returned HTTP 401');
  });
  it('maps network failures to 502', async () => {
    fetchMock.mockRejectedValue(new Error('private upstream details'));
    await expect(generateProfile(getAiConfig(), 'instructions', 'cv')).rejects.toThrow('Unable to read a response');
  });
  it('maps aborted requests to 504', async () => {
    const signal = AbortSignal.abort(new DOMException('timeout', 'TimeoutError'));
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(signal);
    fetchMock.mockRejectedValue(signal.reason);
    await expect(generateProfile(getAiConfig(), 'instructions', 'cv')).rejects.toBeInstanceOf(GatewayTimeoutException);
  });
  it.each([
    { choices: [] },
    { choices: [{ finish_reason: 'length', message: { content: JSON.stringify(profile) } }] },
  ])('rejects empty or truncated responses', async (response) => {
    fetchMock.mockResolvedValue(Response.json(response));
    await expect(generateProfile(getAiConfig(), 'instructions', 'cv')).rejects.toBeInstanceOf(BadGatewayException);
  });
});
