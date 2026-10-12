import { baseName } from '@/lib/pdf/load';
import { openPdf, renderPage } from '@/lib/pdf/pdfjs';
import type { ClientTool } from '../types';

const tool: ClientTool = {
  async run(input, options) {
    const file = 'files' in input ? input.files[0] : null;
    if (!file) throw new Error('No file');
    const jpg = options.format === 'jpg';
    const pdf = await openPdf(file);
    const files = [];
    for (let i = 0; i < pdf.numPages; i++) {
      const data = await renderPage(pdf, i, Number(options.scale ?? 2), jpg ? 'image/jpeg' : 'image/png');
      files.push({ name: `${baseName(file.name)}-${i + 1}.${jpg ? 'jpg' : 'png'}`, data });
    }
    return { kind: 'files', files };
  },
};

export default tool;
