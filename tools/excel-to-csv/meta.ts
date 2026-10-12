import { mdiFileDelimitedOutline } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'excel-to-csv',
  name: 'Excel → CSV',
  description: 'One CSV per sheet',
  icon: mdiFileDelimitedOutline,
  category: 'data',
  runs: 'client',
  input: 'files',
  accept: ['.xlsx', '.xls', '.ods'],
  multiple: true,
};
