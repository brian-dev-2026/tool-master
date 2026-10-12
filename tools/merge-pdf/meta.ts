import { mdiFileDocumentMultipleOutline } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'merge-pdf',
  name: 'Merge PDFs',
  description: 'Combine into one file',
  icon: mdiFileDocumentMultipleOutline,
  category: 'documents',
  runs: 'client',
  input: 'files',
  accept: ['.pdf'],
  multiple: true,
  mode: 'all',
};
