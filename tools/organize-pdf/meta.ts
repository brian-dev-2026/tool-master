import { mdiViewGridOutline } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'organize-pdf',
  name: 'Organize Pages',
  description: 'Reorder, rotate or delete pages',
  icon: mdiViewGridOutline,
  category: 'documents',
  runs: 'client',
  input: 'files',
  accept: ['.pdf'],
  customUi: true,
};
