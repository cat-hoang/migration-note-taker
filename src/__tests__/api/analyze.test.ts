/**
 * @jest-environment node
 */
import { POST } from '@/app/api/analyze/route';

// ---------------------------------------------------------------------------
// Mock lib dependencies so the route doesn't call external APIs
// ---------------------------------------------------------------------------
jest.mock('@/lib/claude', () => ({
  analyzeWithClaude: jest.fn().mockResolvedValue({
    facts: [{ id: 'fact-001', type: 'fact', summary: 'Fact from Claude', quote: 'Fact quote', speaker: 'client' }],
    questions: [],
    provider: 'claude',
  }),
}));

jest.mock('@/lib/openai', () => ({
  analyzeWithOpenAI: jest.fn().mockResolvedValue({
    facts: [],
    questions: [{ id: 'question-001', type: 'question', summary: 'Q from OpenAI', quote: 'Q quote', speaker: 'client' }],
    provider: 'openai',
  }),
}));

jest.mock('@/lib/localAnalyzer', () => ({
  analyzeLocally: jest.fn().mockReturnValue({
    facts: [{ id: 'fact-001', type: 'fact', summary: 'Local fact', quote: 'Local quote', speaker: 'unknown' }],
    questions: [],
    provider: 'local',
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('POST /api/analyze', () => {
  describe('validation', () => {
    it('returns 400 when transcript is missing', async () => {
      const req = makeRequest({ provider: 'local' });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/transcript is required/i);
    });

    it('returns 400 when transcript is an empty string', async () => {
      const req = makeRequest({ transcript: '   ', provider: 'local' });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('local provider (default)', () => {
    it('calls analyzeLocally and returns its result', async () => {
      const { analyzeLocally } = require('@/lib/localAnalyzer');
      const req = makeRequest({ transcript: 'Client: I am on a 482 visa.' });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.provider).toBe('local');
      expect(analyzeLocally).toHaveBeenCalledWith('Client: I am on a 482 visa.');
    });

    it('uses local provider when provider is explicitly "local"', async () => {
      const { analyzeLocally } = require('@/lib/localAnalyzer');
      analyzeLocally.mockClear();
      const req = makeRequest({ transcript: 'Agent: Hello.\nClient: Hi.', provider: 'local' });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(analyzeLocally).toHaveBeenCalledTimes(1);
    });
  });

  describe('claude provider', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv, ANTHROPIC_API_KEY: 'test-api-key' };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('calls analyzeWithClaude when provider is "claude"', async () => {
      const { analyzeWithClaude } = require('@/lib/claude');
      analyzeWithClaude.mockClear();
      const req = makeRequest({ transcript: 'Client: Tell me about partner visas.', provider: 'claude' });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(analyzeWithClaude).toHaveBeenCalledTimes(1);
      const body = await res.json();
      expect(body.provider).toBe('claude');
    });

    it('returns 503 when Claude is selected but ANTHROPIC_API_KEY is not set', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      const req = makeRequest({ transcript: 'Client: Hello.', provider: 'claude' });
      const res = await POST(req);
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.error).toMatch(/ANTHROPIC_API_KEY/);
    });
  });

  describe('openai provider', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv, OPENAI_API_KEY: 'test-openai-key' };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('calls analyzeWithOpenAI when provider is "openai"', async () => {
      const { analyzeWithOpenAI } = require('@/lib/openai');
      analyzeWithOpenAI.mockClear();
      const req = makeRequest({ transcript: 'Client: What about my spouse?', provider: 'openai' });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(analyzeWithOpenAI).toHaveBeenCalledTimes(1);
      const body = await res.json();
      expect(body.provider).toBe('openai');
    });

    it('returns 503 when OpenAI is selected but OPENAI_API_KEY is not set', async () => {
      delete process.env.OPENAI_API_KEY;
      const req = makeRequest({ transcript: 'Client: Hello.', provider: 'openai' });
      const res = await POST(req);
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.error).toMatch(/OPENAI_API_KEY/);
    });
  });

  describe('error handling', () => {
    it('returns 500 when the analysis throws an error', async () => {
      const { analyzeLocally } = require('@/lib/localAnalyzer');
      analyzeLocally.mockImplementationOnce(() => {
        throw new Error('Analysis failed unexpectedly');
      });
      const req = makeRequest({ transcript: 'Client: Hello.', provider: 'local' });
      const res = await POST(req);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toMatch(/Analysis failed unexpectedly/);
    });
  });
});
