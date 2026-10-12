import { PDFDocument, degrees } from 'pdf-lib';
import { baseName, loadPdf, pdfBlob, type PdfSource } from '@/lib/pdf/load';
import { ToolError, type ClientTool } from '../types';

/** Builds a new PDF from `order` (0-based); pages left out are dropped. Optional extra rotation per output page. */
export async function reorderPages(source: PdfSource, order: number[], rotations: number[] = []): Promise<Uint8Array> {
  if (!order.length) throw new ToolError('Keep at least one page', 'BAD_INPUT', 400);
  const doc = await loadPdf(source);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, order);
  pages.forEach((page, i) => {
    if (rotations[i]) page.setRotation(degrees((page.getRotation().angle + rotations[i]) % 360));
    out.addPage(page);
  });
  return out.save();
}

const tool: ClientTool = {
  async run(input, options) {
    const file = 'files' in input ? input.files[0] : null;
    if (!file) throw new Error('No file');
    const order = JSON.parse(String(options.order ?? '[]')) as number[];
    const rotations = JSON.parse(String(options.rotations ?? '[]')) as number[];
    const bytes = await reorderPages(file, order, rotations);
    return { kind: 'files', files: [{ name: `${baseName(file.name)}-organized.pdf`, data: pdfBlob(bytes) }] };
  },
};

export default tool;
