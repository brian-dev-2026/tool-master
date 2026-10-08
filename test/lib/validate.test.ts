import { describe, expect, it } from 'vitest';
import { validateFiles } from '@/lib/validate';
import type { ToolMeta } from '@/tools/types';

const meta = (over: Partial<ToolMeta> = {}): ToolMeta => ({
  slug: 'word-to-pdf', name: 'Word → PDF', description: '', icon: '', category: 'documents',
  runs: 'server', input: 'files', accept: ['.docx'], multiple: true, ...over,
});

describe('validateFiles', () => {
  it('accepts extensions case-insensitively', () => {
    const r = validateFiles([new File(['x'], 'Report.DOCX')], meta());
    expect(r.ok).toHaveLength(1);
    expect(r.rejected).toHaveLength(0);
  });

  it('rejects the wrong type with the accept list', () => {
    const r = validateFiles([new File(['x'], 'notes.txt')], meta());
    expect(r.rejected[0].reason).toBe('Only .docx files');
  });

  it('rejects files over the size limit', () => {
    const big = new File([new Uint8Array(51 * 1024 * 1024)], 'a.docx');
    expect(validateFiles([big], meta()).rejected[0].reason).toBe('Larger than 50 MB');
  });

  it('keeps only the first file when the tool is single-file', () => {
    const files = ['a', 'b', 'c'].map((n) => new File(['x'], `${n}.docx`));
    expect(validateFiles(files, meta({ multiple: false })).ok.map((f) => f.name)).toEqual(['a.docx']);
  });
});
