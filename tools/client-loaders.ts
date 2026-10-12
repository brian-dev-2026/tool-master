import type { ClientTool } from './types';

export const clientLoaders: Record<string, () => Promise<{ default: ClientTool }>> = {
  'merge-pdf': () => import('./merge-pdf/client'),
  'split-pdf': () => import('./split-pdf/client'),
  'images-to-pdf': () => import('./images-to-pdf/client'),
  'pdf-to-images': () => import('./pdf-to-images/client'),
  'rotate-pdf': () => import('./rotate-pdf/client'),
  'organize-pdf': () => import('./organize-pdf/client'),
  'page-numbers': () => import('./page-numbers/client'),
  'watermark-pdf': () => import('./watermark-pdf/client'),
  'csv-to-excel': () => import('./csv-to-excel/client'),
  'csv-to-json': () => import('./csv-to-json/client'),
  'excel-to-csv': () => import('./excel-to-csv/client'),
  'excel-to-json': () => import('./excel-to-json/client'),
  'json-to-csv': () => import('./json-to-csv/client'),
  'json-to-excel': () => import('./json-to-excel/client'),
};
