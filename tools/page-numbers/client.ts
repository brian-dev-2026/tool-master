import { StandardFonts, rgb } from 'pdf-lib';
import { baseName, loadPdf, pdfBlob, type PdfSource } from '@/lib/pdf/load';
import type { ClientTool } from '../types';

export type LabelFormat = 'n' | 'page-n' | 'n-of-total';
export type Position = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export function pageLabel(format: LabelFormat, index: number, start: number, total: number): string {
  const n = start + index;
  if (format === 'page-n') return `Page ${n}`;
  if (format === 'n-of-total') return `${n} of ${start + total - 1}`;
  return String(n);
}

const MARGIN = 28;

export async function addPageNumbers(
  source: PdfSource,
  opts: { position: Position; start: number; format: LabelFormat; fontSize: number },
): Promise<Uint8Array> {
  const doc = await loadPdf(source);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  pages.forEach((page, i) => {
    const text = pageLabel(opts.format, i, opts.start, pages.length);
    const textWidth = font.widthOfTextAtSize(text, opts.fontSize);
    const { width, height } = page.getSize();
    const [vertical, horizontal] = opts.position.split('-');
    const x = horizontal === 'left' ? MARGIN : horizontal === 'right' ? width - MARGIN - textWidth : (width - textWidth) / 2;
    const y = vertical === 'top' ? height - MARGIN - opts.fontSize : MARGIN;
    page.drawText(text, { x, y, size: opts.fontSize, font, color: rgb(0.2, 0.25, 0.33) });
  });
  return doc.save();
}

const tool: ClientTool = {
  async run(input, options) {
    const file = 'files' in input ? input.files[0] : null;
    if (!file) throw new Error('No file');
    const bytes = await addPageNumbers(file, {
      position: (options.position as Position) ?? 'bottom-center',
      start: Number(options.start ?? 1),
      format: (options.format as LabelFormat) ?? 'n',
      fontSize: Number(options.fontSize ?? 12),
    });
    return { kind: 'files', files: [{ name: `${baseName(file.name)}-numbered.pdf`, data: pdfBlob(bytes) }] };
  },
};

export default tool;
