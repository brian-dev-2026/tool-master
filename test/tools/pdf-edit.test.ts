import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { rotatePages } from '@/tools/rotate-pdf/client';
import { reorderPages } from '@/tools/organize-pdf/client';
import { addPageNumbers, pageLabel } from '@/tools/page-numbers/client';
import { addWatermark } from '@/tools/watermark-pdf/client';

/** Page i is (200 + i) wide, so pages can be identified after reordering. */
async function pdfWithPages(n: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < n; i++) doc.addPage([200 + i, 300]);
  return doc.save();
}

const load = (bytes: Uint8Array) => PDFDocument.load(bytes);

describe('rotatePages', () => {
  it('rotates only the chosen pages and adds rotations mod 360', async () => {
    const once = await rotatePages(await pdfWithPages(2), 90, [0]);
    let doc = await load(once);
    expect(doc.getPages().map((p) => p.getRotation().angle)).toEqual([90, 0]);
    doc = await load(await rotatePages(once, 270, [0]));
    expect(doc.getPage(0).getRotation().angle).toBe(0);
  });

  it("rotates every page with 'all'", async () => {
    const doc = await load(await rotatePages(await pdfWithPages(3), 180, 'all'));
    expect(doc.getPages().map((p) => p.getRotation().angle)).toEqual([180, 180, 180]);
  });
});

describe('reorderPages', () => {
  it('keeps only the listed pages, in the listed order', async () => {
    const doc = await load(await reorderPages(await pdfWithPages(5), [4, 0]));
    expect(doc.getPages().map((p) => p.getWidth())).toEqual([204, 200]);
  });

  it('refuses to produce an empty PDF', async () => {
    await expect(reorderPages(await pdfWithPages(2), [])).rejects.toThrow('Keep at least one page');
  });
});

describe('pageLabel', () => {
  it('formats the three label styles', () => {
    expect(pageLabel('n-of-total', 1, 1, 3)).toBe('2 of 3');
    expect(pageLabel('page-n', 0, 5, 3)).toBe('Page 5');
    expect(pageLabel('n', 2, 1, 3)).toBe('3');
  });
});

describe('addPageNumbers', () => {
  it('keeps the page count and changes the content', async () => {
    const input = await pdfWithPages(3);
    const output = await addPageNumbers(input, { position: 'bottom-center', start: 1, format: 'n-of-total', fontSize: 12 });
    expect((await load(output)).getPageCount()).toBe(3);
    expect(Buffer.from(output).equals(Buffer.from(input))).toBe(false);
  });
});

describe('addWatermark', () => {
  it('keeps the page count and grows the file', async () => {
    const input = await pdfWithPages(2);
    const output = await addWatermark(input, { text: 'CONFIDENTIAL', fontSize: 48, opacity: 0.2, rotation: 45, color: '#EF4444' });
    expect((await load(output)).getPageCount()).toBe(2);
    expect(output.length).toBeGreaterThan(input.length);
  });
});
