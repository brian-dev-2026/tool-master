import { PDFDocument } from 'pdf-lib';
import { baseName, loadPdf, pdfBlob, type PdfSource } from '@/lib/pdf/load';
import { parseRanges } from '@/lib/pdf/ranges';
import type { ClientTool } from '../types';

export async function splitPdf(source: PdfSource, base: string, mode: 'every' | 'ranges', ranges: string): Promise<{ name: string; bytes: Uint8Array }[]> {
  const doc = await loadPdf(source);
  const count = doc.getPageCount();
  const groups = mode === 'every' ? doc.getPageIndices().map((i) => [i]) : parseRanges(ranges, count);

  const parts = [];
  for (const group of groups) {
    const part = await PDFDocument.create();
    for (const page of await part.copyPages(doc, group)) part.addPage(page);
    const first = group[0] + 1;
    const last = group[group.length - 1] + 1;
    parts.push({ name: `${base}-p${first === last ? first : `${first}-${last}`}.pdf`, bytes: await part.save() });
  }
  return parts;
}

const tool: ClientTool = {
  async run(input, options) {
    const file = 'files' in input ? input.files[0] : null;
    if (!file) throw new Error('No file');
    const parts = await splitPdf(file, baseName(file.name), options.split === 'every' ? 'every' : 'ranges', String(options.ranges ?? ''));
    return { kind: 'files', files: parts.map((p) => ({ name: p.name, data: pdfBlob(p.bytes) })) };
  },
};

export default tool;
