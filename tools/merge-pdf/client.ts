import { PDFDocument } from 'pdf-lib';
import { loadPdf, pdfBlob, type PdfSource } from '@/lib/pdf/load';
import type { ClientTool } from '../types';

export async function mergePdfs(sources: PdfSource[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  for (const source of sources) {
    const doc = await loadPdf(source);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    for (const page of pages) merged.addPage(page);
  }
  return merged.save();
}

const tool: ClientTool = {
  async run(input) {
    const files = 'files' in input ? input.files : [];
    return { kind: 'files', files: [{ name: 'merged.pdf', data: pdfBlob(await mergePdfs(files)) }] };
  },
};

export default tool;
