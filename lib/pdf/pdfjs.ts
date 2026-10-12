'use client';

import type { PDFDocumentProxy } from 'pdfjs-dist';

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;

/** Lazy-loads pdf.js (browser only) with its worker. */
export function getPdfjs() {
  pdfjsPromise ??= import('pdfjs-dist').then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
    return pdfjs;
  });
  return pdfjsPromise;
}

export async function openPdf(file: Blob): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfjs();
  try {
    return await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  } catch (err) {
    if (err instanceof Error && err.name === 'PasswordException') throw new Error('This PDF is password-protected');
    throw new Error('Not a valid PDF');
  }
}

/** Renders one page (0-based) to an image blob. */
export async function renderPage(pdf: PDFDocumentProxy, index: number, scale: number, type: 'image/png' | 'image/jpeg' = 'image/png'): Promise<Blob> {
  const page = await pdf.getPage(index + 1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  if (type === 'image/jpeg') {
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  await page.render({ canvas, viewport, background: type === 'image/jpeg' ? '#FFFFFF' : undefined }).promise;
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not render page'))), type, 0.92));
}
