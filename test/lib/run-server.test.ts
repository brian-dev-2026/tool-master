import { describe, expect, it } from 'vitest';
import { filenameFromHeader } from '@/lib/run-server';
import { contentDisposition } from '@/lib/server/content-disposition';

describe('filenameFromHeader', () => {
  it('round-trips a non-ASCII name from contentDisposition', () => {
    const name = "Q3 report — José's.pdf";
    expect(filenameFromHeader(contentDisposition(name), 'x')).toBe(name);
  });

  it('falls back to the plain filename, then to the given default', () => {
    expect(filenameFromHeader('attachment; filename="a.pdf"', 'x')).toBe('a.pdf');
    expect(filenameFromHeader(null, 'input.docx')).toBe('input.docx');
  });
});
