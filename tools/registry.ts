import type { ToolMeta } from './types';
import { meta as compressPdf } from './compress-pdf/meta';
import { meta as csvToExcel } from './csv-to-excel/meta';
import { meta as csvToJson } from './csv-to-json/meta';
import { meta as excelToCsv } from './excel-to-csv/meta';
import { meta as excelToJson } from './excel-to-json/meta';
import { meta as jsonToCsv } from './json-to-csv/meta';
import { meta as jsonToExcel } from './json-to-excel/meta';
import { meta as excelToPdf } from './excel-to-pdf/meta';
import { meta as imagesToPdf } from './images-to-pdf/meta';
import { meta as jsonToTypescript } from './json-to-typescript/meta';
import { meta as jsonToXml } from './json-to-xml/meta';
import { meta as jsonToYaml } from './json-to-yaml/meta';
import { meta as markdownToHtml } from './markdown-to-html/meta';
import { meta as xmlToJson } from './xml-to-json/meta';
import { meta as yamlToJson } from './yaml-to-json/meta';
import { meta as mergePdf } from './merge-pdf/meta';
import { meta as organizePdf } from './organize-pdf/meta';
import { meta as pageNumbers } from './page-numbers/meta';
import { meta as pdfToImages } from './pdf-to-images/meta';
import { meta as pdfToWord } from './pdf-to-word/meta';
import { meta as powerpointToPdf } from './powerpoint-to-pdf/meta';
import { meta as rotatePdf } from './rotate-pdf/meta';
import { meta as splitPdf } from './split-pdf/meta';
import { meta as watermarkPdf } from './watermark-pdf/meta';
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
  pdfToImages,
  compressPdf,
  rotatePdf,
  organizePdf,
  pageNumbers,
  watermarkPdf,
  // Data
  excelToJson,
  jsonToExcel,
  csvToExcel,
  excelToCsv,
  csvToJson,
  jsonToCsv,
  xmlToJson,
  jsonToXml,
  yamlToJson,
  jsonToYaml,
  jsonToTypescript,
  markdownToHtml,
];

const bySlug = new Map(tools.map((t) => [t.slug, t]));

export function getTool(slug: string): ToolMeta | undefined {
  return bySlug.get(slug);
}
