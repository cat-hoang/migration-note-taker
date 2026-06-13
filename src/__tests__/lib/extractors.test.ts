/**
 * @jest-environment node
 */
import { extractPdf, extractDocx } from '@/lib/extractors';
import { Buffer } from 'buffer';

// ---------------------------------------------------------------------------
// Mock external modules (pdf-parse and mammoth use native bindings)
// ---------------------------------------------------------------------------
jest.mock('pdf-parse', () =>
  jest.fn().mockResolvedValue({ text: 'Extracted PDF text content' })
);

jest.mock('mammoth', () => ({
  extractRawText: jest.fn().mockResolvedValue({ value: 'Extracted DOCX text content' }),
}));

// ---------------------------------------------------------------------------
// extractPdf
// ---------------------------------------------------------------------------
describe('extractPdf', () => {
  it('returns text extracted from a PDF buffer', async () => {
    const buffer = Buffer.from('fake pdf bytes');
    const text = await extractPdf(buffer);
    expect(text).toBe('Extracted PDF text content');
  });

  it('calls pdf-parse with the provided buffer', async () => {
    const pdfParse = require('pdf-parse');
    const buffer = Buffer.from('another fake pdf');
    await extractPdf(buffer);
    expect(pdfParse).toHaveBeenCalledWith(buffer);
  });

  it('returns a string type', async () => {
    const buffer = Buffer.from('');
    const text = await extractPdf(buffer);
    expect(typeof text).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// extractDocx
// ---------------------------------------------------------------------------
describe('extractDocx', () => {
  it('returns text extracted from a DOCX buffer', async () => {
    const buffer = Buffer.from('fake docx bytes');
    const text = await extractDocx(buffer);
    expect(text).toBe('Extracted DOCX text content');
  });

  it('calls mammoth.extractRawText with the buffer', async () => {
    const mammoth = require('mammoth');
    const buffer = Buffer.from('another fake docx');
    await extractDocx(buffer);
    expect(mammoth.extractRawText).toHaveBeenCalledWith({ buffer });
  });

  it('returns a string type', async () => {
    const buffer = Buffer.from('');
    const text = await extractDocx(buffer);
    expect(typeof text).toBe('string');
  });
});
