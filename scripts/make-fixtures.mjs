// One-off generator for binary test fixtures. Run: node scripts/make-fixtures.mjs
import { writeFile } from 'node:fs/promises';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import PptxGenJS from 'pptxgenjs';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import * as XLSX from 'xlsx';

const dir = new URL('../test/fixtures/', import.meta.url);
const out = (name) => new URL(name, dir);

const doc = new Document({
  sections: [{ children: [new Paragraph({ children: [new TextRun({ text: 'Tool-Master sample document', bold: true })] }), new Paragraph('Hello from a fixture.')] }],
});
await writeFile(out('sample.docx'), await Packer.toBuffer(doc));

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ name: 'Ana', age: 30 }, { name: 'Ben', age: 25 }]), 'People');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ city: 'Lisbon' }, { city: 'Manila' }]), 'Cities');
await writeFile(out('sample.xlsx'), XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
await writeFile(out('two-sheets.xlsx'), XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));

const pptx = new PptxGenJS();
pptx.addSlide().addText('Tool-Master sample slide', { x: 1, y: 1, fontSize: 28 });
await writeFile(out('sample.pptx'), await pptx.write({ outputType: 'nodebuffer' }));

const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
for (let i = 1; i <= 2; i++) pdf.addPage([595.28, 841.89]).drawText(`Sample PDF page ${i}`, { x: 72, y: 760, size: 18, font });
await writeFile(out('sample.pdf'), await pdf.save());

// A truncated .docx: a real zip header with the rest cut off, so no engine can load it.
await writeFile(out('broken.docx'), (await Packer.toBuffer(doc)).subarray(0, 3000));
console.log('fixtures written');
