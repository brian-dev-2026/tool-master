import { degrees } from 'pdf-lib';
import { baseName, loadPdf, pdfBlob, type PdfSource } from '@/lib/pdf/load';
import type { ClientTool } from '../types';

export async function rotatePages(source: PdfSource, angle: 90 | 180 | 270, pages: number[] | 'all'): Promise<Uint8Array> {
  const doc = await loadPdf(source);
  const targets = pages === 'all' ? doc.getPageIndices() : pages;
  for (const index of targets) {
    const page = doc.getPage(index);
    page.setRotation(degrees((page.getRotation().angle + angle) % 360));
  }
  return doc.save();
}

const tool: ClientTool = {
  async run(input, options) {
    const file = 'files' in input ? input.files[0] : null;
    if (!file) throw new Error('No file');
    const pages = options.pages ? (JSON.parse(String(options.pages)) as number[]) : 'all';
    const bytes = await rotatePages(file, Number(options.angle ?? 90) as 90 | 180 | 270, pages.length === 0 ? 'all' : pages);
    return { kind: 'files', files: [{ name: `${baseName(file.name)}-rotated.pdf`, data: pdfBlob(bytes) }] };
  },
};

export default tool;
