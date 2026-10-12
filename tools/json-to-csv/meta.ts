import { mdiTableArrowLeft } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'json-to-csv',
  name: 'JSON → CSV',
  description: 'Nested objects flattened to columns',
  icon: mdiTableArrowLeft,
  category: 'data',
  runs: 'client',
  input: 'files',
  accept: ['.json'],
  multiple: true,
  pasteable: true,
};
