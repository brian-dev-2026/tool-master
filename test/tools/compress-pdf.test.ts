import { describe, expect, it } from 'vitest';
import { keepOriginal } from '@/tools/compress-pdf/server';

describe('compress-pdf keepOriginal', () => {
  it('keeps the original when compression did not shrink the file', () => {
    expect(keepOriginal(1000, 1000)).toBe(true);
    expect(keepOriginal(1000, 1200)).toBe(true);
  });

  it('uses the compressed file when it is smaller', () => {
    expect(keepOriginal(1000, 400)).toBe(false);
  });
});
