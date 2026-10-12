import { PDFDocument } from 'pdf-lib';
import { ToolError } from '@/tools/types';

export type PdfSource = ArrayBuffer | Uint8Array | Blob;

export async function toBytes(source: PdfSource): Promise<Uint8Array> {
  if (source instanceof Uint8Array) return source;
  if (source instanceof ArrayBuffer) return new Uint8Array(source);
  return new Uint8Array(await source.arrayBuffer());
}

/** Loads a PDF, turning pdf-lib's internal errors into messages a person can act on. */
export async function loadPdf(source: PdfSource): Promise<PDFDocument> {
  const bytes = await toBytes(source);
  try {
    return await PDFDocument.load(bytes);
  } catch (err) {
    const name = err instanceof Error ? `${err.name} ${err.message}` : '';
    if (/encrypt/i.test(name)) throw new ToolError('This PDF is password-protected', 'BAD_INPUT', 400);
    throw new ToolError('Not a valid PDF', 'BAD_INPUT', 400);
  }
}

export function baseName(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

export function pdfBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}
