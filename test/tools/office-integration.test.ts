import { describe, expect, it } from 'vitest';
import { copyFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { detectEngines } from '@/lib/engines/detect';
import { officeTool } from '@/lib/engines/office';
import { libreofficeConvert } from '@/lib/engines/libreoffice';
import { withTempDir } from '@/lib/jobs/tempdir';
import { ToolError } from '@/tools/types';

const fixture = (name: string) => join(__dirname, '..', 'fixtures', name);
const engines = await detectEngines();
const TIMEOUT = 120_000;

async function convert(engine: 'msoffice' | 'libreoffice', app: 'word' | 'excel' | 'powerpoint', target: 'pdf' | 'docx', file: string, originalName = file) {
  const tool = officeTool(app, target);
  return withTempDir(async (dir) => {
    const input = join(dir, `input${file.slice(file.lastIndexOf('.'))}`);
    await copyFile(fixture(file), input);
    const result = await tool.run(input, originalName, { engine }, { dir, signal: AbortSignal.timeout(TIMEOUT) });
    return { name: result.name, mime: result.mime, head: (await readFile(result.path)).subarray(0, 4).toString('latin1') };
  });
}

for (const engine of ['libreoffice', 'msoffice'] as const) {
  const has = (app: 'word' | 'excel' | 'powerpoint') => (engine === 'libreoffice' ? engines.libreoffice : engines[app]);

  describe.skipIf(!has('word'))(`${engine}: Word`, () => {
    it('converts .docx to PDF and keeps a non-ASCII name', async () => {
      const r = await convert(engine, 'word', 'pdf', 'sample.docx', "Q3 report — José's.docx");
      expect(r.head).toBe('%PDF');
      expect(r.name).toBe("Q3 report — José's.pdf");
      expect(r.mime).toBe('application/pdf');
    }, TIMEOUT);

    it('converts a PDF to .docx', async () => {
      const r = await convert(engine, 'word', 'docx', 'sample.pdf');
      expect(r.head.slice(0, 2)).toBe('PK');
      expect(r.name).toBe('sample.docx');
    }, TIMEOUT);

    it('rejects a truncated .docx with a ToolError instead of hanging', async () => {
      await expect(convert(engine, 'word', 'pdf', 'broken.docx')).rejects.toBeInstanceOf(ToolError);
    }, 60_000);
  });

  describe.skipIf(!has('excel'))(`${engine}: Excel`, () => {
    it('converts .xlsx to PDF', async () => {
      expect((await convert(engine, 'excel', 'pdf', 'sample.xlsx')).head).toBe('%PDF');
    }, TIMEOUT);
  });

  describe.skipIf(!has('powerpoint'))(`${engine}: PowerPoint`, () => {
    it('converts .pptx to PDF', async () => {
      expect((await convert(engine, 'powerpoint', 'pdf', 'sample.pptx')).head).toBe('%PDF');
    }, TIMEOUT);
  });
}

describe.skipIf(!engines.libreoffice)('libreofficeConvert', () => {
  it('handles input paths with spaces, accents and apostrophes', async () => {
    await withTempDir(async (dir) => {
      const input = join(dir, "Q3 report — José's.docx");
      await copyFile(fixture('sample.docx'), input);
      const out = await libreofficeConvert(input, join(dir, 'out'), 'pdf', AbortSignal.timeout(TIMEOUT));
      expect((await readFile(out)).subarray(0, 4).toString('latin1')).toBe('%PDF');
    });
  }, TIMEOUT);
});
