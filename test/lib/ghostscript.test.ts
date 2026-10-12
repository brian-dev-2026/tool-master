import { describe, expect, it } from 'vitest';
import { copyFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { findGhostscript } from '@/lib/engines/detect';
import { ghostscriptCompress, gsArgs } from '@/lib/engines/ghostscript';
import { withTempDir } from '@/lib/jobs/tempdir';

describe('gsArgs', () => {
  it('maps the user-facing levels to PDFSETTINGS presets', () => {
    expect(gsArgs('strong', 'in.pdf', 'out.pdf')).toContain('-dPDFSETTINGS=/screen');
    expect(gsArgs('balanced', 'in.pdf', 'out.pdf')).toContain('-dPDFSETTINGS=/ebook');
    expect(gsArgs('light', 'in.pdf', 'out.pdf')).toContain('-dPDFSETTINGS=/printer');
  });

  it('runs non-interactively and keeps the output path as one argument', () => {
    const args = gsArgs('balanced', 'C:/a b/in.pdf', "C:/a b/José's out.pdf");
    for (const flag of ['-sDEVICE=pdfwrite', '-dNOPAUSE', '-dBATCH', '-dQUIET', '-dSAFER']) expect(args).toContain(flag);
    expect(args).toContain("-sOutputFile=C:/a b/José's out.pdf");
    expect(args.at(-1)).toBe('C:/a b/in.pdf');
  });
});

const gs = await findGhostscript();

describe.skipIf(!gs)('ghostscriptCompress', () => {
  it('produces a valid PDF', async () => {
    await withTempDir(async (dir) => {
      const input = join(dir, 'in.pdf');
      const output = join(dir, 'out.pdf');
      await copyFile(join(__dirname, '..', 'fixtures', 'sample.pdf'), input);
      await ghostscriptCompress(input, output, 'balanced', AbortSignal.timeout(60_000));
      expect((await readFile(output)).subarray(0, 4).toString('latin1')).toBe('%PDF');
    });
  }, 60_000);
});
