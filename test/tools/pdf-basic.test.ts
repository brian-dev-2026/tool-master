import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { loadPdf } from '@/lib/pdf/load';
import { mergePdfs } from '@/tools/merge-pdf/client';
import { splitPdf } from '@/tools/split-pdf/client';
import { imagesToPdf } from '@/tools/images-to-pdf/client';
import { makePng } from '../helpers/png';

async function pdfWithPages(n: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < n; i++) doc.addPage([200 + i, 300]);
  return doc.save();
}

const pageCount = async (bytes: Uint8Array) => (await PDFDocument.load(bytes)).getPageCount();

describe('mergePdfs', () => {
  it('concatenates every page in order', async () => {
    const merged = await mergePdfs([await pdfWithPages(2), await pdfWithPages(3)]);
    const doc = await PDFDocument.load(merged);
    expect(doc.getPageCount()).toBe(5);
    expect(doc.getPages().map((p) => p.getWidth())).toEqual([200, 201, 200, 201, 202]);
  });
});

describe('splitPdf', () => {
  it("splits every page into its own file in 'every' mode", async () => {
    const parts = await splitPdf(await pdfWithPages(5), 'report', 'every', '');
    expect(parts.map((p) => p.name)).toEqual(['report-p1.pdf', 'report-p2.pdf', 'report-p3.pdf', 'report-p4.pdf', 'report-p5.pdf']);
  });

  it('builds one file per range', async () => {
    const parts = await splitPdf(await pdfWithPages(5), 'report', 'ranges', '1-2,4');
    expect(parts.map((p) => p.name)).toEqual(['report-p1-2.pdf', 'report-p4.pdf']);
    expect(await Promise.all(parts.map((p) => pageCount(p.bytes)))).toEqual([2, 1]);
  });
});

describe('imagesToPdf', () => {
  const png = (w: number, h: number) => ({ bytes: makePng(w, h), type: 'png' as const });

  it('sizes each page to its image in fit mode', async () => {
    const doc = await PDFDocument.load(await imagesToPdf([png(40, 30), png(20, 50)], 'fit', 0));
    expect(doc.getPages().map((p) => [p.getWidth(), p.getHeight()])).toEqual([[40, 30], [20, 50]]);
  });

  it('uses A4 pages in a4 mode', async () => {
    const doc = await PDFDocument.load(await imagesToPdf([png(40, 30)], 'a4', 20));
    expect(doc.getPage(0).getWidth()).toBeCloseTo(595.28, 1);
    expect(doc.getPage(0).getHeight()).toBeCloseTo(841.89, 1);
  });
});

describe('loadPdf', () => {
  it('explains password-protected PDFs', async () => {
    const bytes = await readFile(join(__dirname, '..', 'fixtures', 'encrypted.pdf'));
    await expect(loadPdf(bytes)).rejects.toThrow('This PDF is password-protected');
  });

  it('explains files that are not PDFs', async () => {
    await expect(loadPdf(new Uint8Array([1, 2, 3, 4, 5]))).rejects.toThrow('Not a valid PDF');
  });
});
