/**
 * @jest-environment node
 */
import { GET } from '@/app/api/providers/route';

describe('GET /api/providers', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns claude: false and openai: false when no API keys are set', async () => {
    process.env = { ...originalEnv };
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ claude: false, openai: false });
  });

  it('returns claude: true when ANTHROPIC_API_KEY is set', async () => {
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: 'test-key' };
    delete process.env.OPENAI_API_KEY;

    const res = await GET();
    const body = await res.json();
    expect(body.claude).toBe(true);
    expect(body.openai).toBe(false);
  });

  it('returns openai: true when OPENAI_API_KEY is set', async () => {
    process.env = { ...originalEnv, OPENAI_API_KEY: 'test-key' };
    delete process.env.ANTHROPIC_API_KEY;

    const res = await GET();
    const body = await res.json();
    expect(body.claude).toBe(false);
    expect(body.openai).toBe(true);
  });

  it('returns both providers true when both API keys are set', async () => {
    process.env = {
      ...originalEnv,
      ANTHROPIC_API_KEY: 'test-claude-key',
      OPENAI_API_KEY: 'test-openai-key',
    };

    const res = await GET();
    const body = await res.json();
    expect(body.claude).toBe(true);
    expect(body.openai).toBe(true);
  });

  it('returns JSON with the correct Content-Type', async () => {
    const res = await GET();
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
  });
});
