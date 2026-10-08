import { mdiFileExcelOutline } from '@mdi/js';
import { engineOption } from '../shared/engine-option';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'excel-to-pdf',
  name: 'Excel → PDF',
  description: 'Spreadsheets to print-ready PDF',
  icon: mdiFileExcelOutline,
  category: 'documents',
  runs: 'server',
  input: 'files',
  accept: ['.xls', '.xlsx', '.ods', '.csv'],
  multiple: true,
  options: [engineOption],
  requires: ['excel', 'libreoffice'],
  engineFor: 'excel',
};
