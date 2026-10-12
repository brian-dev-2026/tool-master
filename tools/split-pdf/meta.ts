import { mdiCallSplit } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'split-pdf',
  name: 'Split PDF',
  description: 'Every page or chosen ranges',
  icon: mdiCallSplit,
  category: 'documents',
  runs: 'client',
  input: 'files',
  accept: ['.pdf'],
  options: [
    {
      type: 'segmented',
      key: 'split',
      label: 'Split',
      choices: [
        { value: 'every', label: 'Every page' },
        { value: 'ranges', label: 'Ranges' },
      ],
      default: 'ranges',
    },
    { type: 'text', key: 'ranges', label: 'Pages', default: '', placeholder: '1-3, 5, 8-10' },
  ],
};
