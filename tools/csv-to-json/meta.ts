import { mdiCodeBraces } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'csv-to-json',
  name: 'CSV → JSON',
  description: 'Rows to typed JSON',
  icon: mdiCodeBraces,
  category: 'data',
  runs: 'client',
  input: 'files',
  accept: ['.csv', '.tsv', '.txt'],
  multiple: true,
  pasteable: true,
  options: [{ type: 'checkbox', key: 'header', label: 'First row is the header', default: true }],
};
