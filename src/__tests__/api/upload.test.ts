/**
 * @jest-environment node
 */
import { POST } from '@/app/api/upload/route';

// ---------------------------------------------------------------------------
// Mock extractors so tests don't need actual PDF/DOCX files
// ---------------------------------------------------------------------------
jest.mock('@/lib/extractors', () => ({
  extractPdf: jest.fn().mockResolvedValue('Extracted PDF text'),
  extractDocx: jest.fn().mockResolvedValue('Extracted DOCX text'),
}));

// ---------------------------------------------------------------------------
// Helper: build a fake FormData request
// ---------------------------------------------------------------------------
function makeUploadRequest(file: File | null): Request {
  const formData = new FormData();
  if (file) formData.append('file', file);
  return new Request('http://localhost/api/upload', {
    method: 'POST',
    body: formData,
  });
}

function makeTextFile(content: string, name = 'transcript.txt', type = 'text/plain'): File {
  return new File([content], name, { type });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('POST /api/upload', () => {
  describe('validation', () => {
    it('returns 400 when no file is provided', async () => {
      const req = makeUploadRequest(null);
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/no file provided/i);
    });

    it('returns 413 when file exceeds 10 MB', async () => {
      // Create a file that exceeds 10 MB limit (10 * 1024 * 1024 bytes)
      const bigContent = 'A'.repeat(10 * 1024 * 1024 + 1);
      const file = makeTextFile(bigContent, 'big.txt');
      const req = makeUploadRequest(file);
      const res = await POST(req);
      expect(res.status).toBe(413);
      const body = await res.json();
      expect(body.error).toMatch(/10 MB/);
    });

    it('returns 415 for unsupported file types', async () => {
      const file = new File(['content'], 'document.xyz', { type: 'application/xyz' });
      const req = makeUploadRequest(file);
      const res = await POST(req);
      expect(res.status).toBe(415);
      const body = await res.json();
      expect(body.error).toMatch(/unsupported file type/i);
    });
  });

  describe('plain text files', () => {
    it('returns the text content of a .txt file', async () => {
      const content = 'Agent: Hello.\nClient: I need help with my visa.';
      const file = makeTextFile(content, 'transcript.txt', 'text/plain');
      const req = makeUploadRequest(file);
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.text).toContain('I need help with my visa');
    });

    it('normalises Windows line endings to Unix', async () => {
      const content = 'Agent: Hello.\r\nClient: Hi there.\r\n';
      const file = makeTextFile(content, 'transcript.txt', 'text/plain');
      const req = makeUploadRequest(file);
      const res = await POST(req);
      const body = await res.json();
      expect(body.text).not.toContain('\r\n');
    });

    it('trims leading and trailing whitespace from result', async () => {
      const content = '   Agent: Hello.   ';
      const file = makeTextFile(content, 'transcript.txt', 'text/plain');
      const req = makeUploadRequest(file);
      const res = await POST(req);
      const body = await res.json();
      expect(body.text).toBe('Agent: Hello.');
    });
  });

  describe('PDF files', () => {
    it('calls extractPdf and returns extracted text', async () => {
      const { extractPdf } = require('@/lib/extractors');
      extractPdf.mockClear();
      const file = new File(['fake pdf bytes'], 'document.pdf', { type: 'application/pdf' });
      const req = makeUploadRequest(file);
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(extractPdf).toHaveBeenCalledTimes(1);
      const body = await res.json();
      expect(body.text).toBe('Extracted PDF text');
    });

    it('handles .pdf extension with no explicit mime type', async () => {
      const { extractPdf } = require('@/lib/extractors');
      extractPdf.mockClear();
      const file = new File(['fake pdf bytes'], 'document.pdf', { type: '' });
      const req = makeUploadRequest(file);
      const res = await POST(req);
      expect(extractPdf).toHaveBeenCalledTimes(1);
    });
  });

  describe('DOCX files', () => {
    it('calls extractDocx and returns extracted text', async () => {
      const { extractDocx } = require('@/lib/extractors');
      extractDocx.mockClear();
      const file = new File(
        ['fake docx bytes'],
        'document.docx',
        { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      );
      const req = makeUploadRequest(file);
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(extractDocx).toHaveBeenCalledTimes(1);
      const body = await res.json();
      expect(body.text).toBe('Extracted DOCX text');
    });

    it('handles .docx extension with no explicit mime type', async () => {
      const { extractDocx } = require('@/lib/extractors');
      extractDocx.mockClear();
      const file = new File(['fake docx bytes'], 'document.docx', { type: '' });
      const req = makeUploadRequest(file);
      const res = await POST(req);
      expect(extractDocx).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('returns 500 when extraction throws an error', async () => {
      const { extractPdf } = require('@/lib/extractors');
      extractPdf.mockRejectedValueOnce(new Error('PDF parsing failed'));
      const file = new File(['bad pdf'], 'document.pdf', { type: 'application/pdf' });
      const req = makeUploadRequest(file);
      const res = await POST(req);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toMatch(/failed to process file/i);
    });
  });
});
