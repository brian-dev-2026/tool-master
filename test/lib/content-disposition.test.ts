import { describe, expect, it } from 'vitest';
import { contentDisposition } from '@/lib/server/content-disposition';

describe('contentDisposition', () => {
  const header = contentDisposition("Q3 report — José's.pdf");

  it('encodes the UTF-8 name per RFC 5987', () => {
    expect(header).toContain("filename*=UTF-8''Q3%20report%20%E2%80%94%20Jos%C3%A9%27s.pdf");
  });

  it('has an ASCII-only fallback without quotes inside', () => {
    const fallback = /filename="([^"]*)"/.exec(header)![1];
    expect(fallback).toMatch(/^[\x20-\x7e]+$/);
    expect(header.startsWith('attachment;')).toBe(true);
  });
});
