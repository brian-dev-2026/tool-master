import { mdiRotateRight } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'rotate-pdf',
  name: 'Rotate PDF',
  description: 'Turn some or all pages',
  icon: mdiRotateRight,
  category: 'documents',
  runs: 'client',
  input: 'files',
  accept: ['.pdf'],
  customUi: true,
};
