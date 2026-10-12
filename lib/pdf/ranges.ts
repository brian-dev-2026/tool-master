import { ToolError } from '@/tools/types';

/** "1-3, 5, 8-" → [[0,1,2],[4],[7..last]] (0-based page indexes). */
export function parseRanges(spec: string, pageCount: number): number[][] {
  const tokens = spec.split(',').map((t) => t.trim()).filter(Boolean);
  if (!tokens.length) throw new ToolError('Enter at least one page range', 'BAD_INPUT', 400);

  return tokens.map((token) => {
    const match = /^(\d+)(?:\s*-\s*(\d*))?$/.exec(token);
    const bad = () => new ToolError(`Invalid page range: "${token}"`, 'BAD_INPUT', 400);
    if (!match) throw bad();
    const start = Number(match[1]);
    const end = match[2] === undefined ? start : match[2] === '' ? pageCount : Number(match[2]);
    if (start < 1 || end < start || end > pageCount) throw bad();
    return Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i);
  });
}
