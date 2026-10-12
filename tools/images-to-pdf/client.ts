import { PDFDocument, PageSizes } from 'pdf-lib';
import { pdfBlob } from '@/lib/pdf/load';
import { extOf } from '@/lib/validate';
import type { ClientTool } from '../types';

export type PageSize = 'fit' | 'a4' | 'letter';
export interface ImageInput {
  bytes: Uint8Array;
  type: 'png' | 'jpg';
}

export async function imagesToPdf(images: ImageInput[], pageSize: PageSize, margin: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const image of images) {
    const embedded = image.type === 'png' ? await doc.embedPng(image.bytes) : await doc.embedJpg(image.bytes);
    const { width, height } = embedded;

    if (pageSize === 'fit') {
      doc.addPage([width + margin * 2, height + margin * 2]).drawImage(embedded, { x: margin, y: margin, width, height });
      continue;
    }

    const [pw, ph] = pageSize === 'a4' ? PageSizes.A4 : PageSizes.Letter;
    const scale = Math.min((pw - margin * 2) / width, (ph - margin * 2) / height, 1);
    const w = width * scale;
    const h = height * scale;
    doc.addPage([pw, ph]).drawImage(embedded, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
  }
  return doc.save();
}

/** pdf-lib only embeds PNG and JPEG, so WebP is re-encoded to PNG in the browser first. */
async function toImageInput(file: File): Promise<ImageInput> {
  const ext = extOf(file.name);
  if (ext === '.jpg' || ext === '.jpeg') return { bytes: new Uint8Array(await file.arrayBuffer()), type: 'jpg' };
  if (ext === '.png') return { bytes: new Uint8Array(await file.arrayBuffer()), type: 'png' };
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
  const png = await canvas.convertToBlob({ type: 'image/png' });
  return { bytes: new Uint8Array(await png.arrayBuffer()), type: 'png' };
}

const tool: ClientTool = {
  async run(input, options) {
    const files = 'files' in input ? input.files : [];
    const images = await Promise.all(files.map(toImageInput));
    const bytes = await imagesToPdf(images, (options.pageSize as PageSize) ?? 'fit', Number(options.margin ?? 0));
    return { kind: 'files', files: [{ name: 'images.pdf', data: pdfBlob(bytes) }] };
  },
};

export default tool;
