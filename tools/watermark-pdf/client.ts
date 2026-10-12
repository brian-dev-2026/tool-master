import { StandardFonts, degrees, rgb } from 'pdf-lib';
import { baseName, loadPdf, pdfBlob, type PdfSource } from '@/lib/pdf/load';
import type { ClientTool } from '../types';

export function hexToRgb(hex: string) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value.padEnd(6, '0');
  const n = parseInt(full, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export async function addWatermark(
  source: PdfSource,
  opts: { text: string; fontSize: number; opacity: number; rotation: number; color: string },
): Promise<Uint8Array> {
  const doc = await loadPdf(source);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const textWidth = font.widthOfTextAtSize(opts.text, opts.fontSize);
  const angle = (opts.rotation * Math.PI) / 180;

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    // Offset the start point so the rotated text is centred on the page.
    const x = width / 2 - (Math.cos(angle) * textWidth) / 2 + (Math.sin(angle) * opts.fontSize) / 2;
    const y = height / 2 - (Math.sin(angle) * textWidth) / 2 - (Math.cos(angle) * opts.fontSize) / 2;
    page.drawText(opts.text, { x, y, size: opts.fontSize, font, color: hexToRgb(opts.color), opacity: opts.opacity, rotate: degrees(opts.rotation) });
  }
  return doc.save();
}

const tool: ClientTool = {
  async run(input, options) {
    const file = 'files' in input ? input.files[0] : null;
    if (!file) throw new Error('No file');
    const bytes = await addWatermark(file, {
      text: String(options.text || 'CONFIDENTIAL'),
      fontSize: Number(options.fontSize ?? 48),
      opacity: Number(options.opacity ?? 0.2),
      rotation: Number(options.rotation ?? 45),
      color: String(options.color ?? '#EF4444'),
    });
    return { kind: 'files', files: [{ name: `${baseName(file.name)}-watermarked.pdf`, data: pdfBlob(bytes) }] };
  },
};

export default tool;
