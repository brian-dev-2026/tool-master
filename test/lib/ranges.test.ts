import { describe, expect, it } from 'vitest';
import { parseRanges } from '@/lib/pdf/ranges';

describe('parseRanges', () => {
  it('parses ranges and single pages into 0-based groups', () => {
    expect(parseRanges('1-3, 5', 10)).toEqual([[0, 1, 2], [4]]);
  });

  it('treats an open range as running to the last page', () => {
    expect(parseRanges('8-', 10)).toEqual([[7, 8, 9]]);
  });

  it('ignores surrounding whitespace', () => {
    expect(parseRanges(' 2 ', 10)).toEqual([[1]]);
  });

  it.each(['0', '5-2', '11', 'abc'])('rejects %s and names the bad token', (token) => {
    expect(() => parseRanges(token, 10)).toThrow(`Invalid page range: "${token}"`);
  });

  it('asks for input when empty', () => {
    expect(() => parseRanges('  ', 10)).toThrow('Enter at least one page range');
  });
});
