import { mdiFileExcelOutline } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'csv-to-excel',
  name: 'CSV → Excel',
  description: 'Comma or semicolon files to .xlsx',
  icon: mdiFileExcelOutline,
  category: 'data',
  runs: 'client',
  input: 'files',
  accept: ['.csv', '.tsv', '.txt'],
  multiple: true,
  pasteable: true,
};
