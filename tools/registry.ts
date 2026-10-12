import type { ToolMeta } from './types';
import { meta as compressPdf } from './compress-pdf/meta';
import { meta as excelToPdf } from './excel-to-pdf/meta';
import { meta as imagesToPdf } from './images-to-pdf/meta';
import { meta as mergePdf } from './merge-pdf/meta';
import { meta as pdfToWord } from './pdf-to-word/meta';
import { meta as powerpointToPdf } from './powerpoint-to-pdf/meta';
import { meta as splitPdf } from './split-pdf/meta';
import { meta as wordToPdf } from './word-to-pdf/meta';

// Metadata only — never import tool implementations here, so the home page stays light.
export const tools: ToolMeta[] = [
  // Documents
  pdfToWord,
  wordToPdf,
  excelToPdf,
  powerpointToPdf,
  mergePdf,
  splitPdf,
  imagesToPdf,
  compressPdf,
];

const bySlug = new Map(tools.map((t) => [t.slug, t]));

export function getTool(slug: string): ToolMeta | undefined {
  return bySlug.get(slug);
}
