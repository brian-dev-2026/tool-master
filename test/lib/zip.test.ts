import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { zipOutputs } from '@/lib/zip';

describe('zipOutputs', () => {
  it('dedupes repeated file names', async () => {
    const blob = await zipOutputs([
      { name: 'a.pdf', data: new Blob(['1']) },
      { name: 'a.pdf', data: new Blob(['2']) },
    ]);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(Object.keys(zip.files).sort()).toEqual(['a (2).pdf', 'a.pdf']);
    expect(await zip.file('a (2).pdf')!.async('string')).toBe('2');
  });
});
