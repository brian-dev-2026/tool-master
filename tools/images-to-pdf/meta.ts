import { mdiImageMultipleOutline } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'images-to-pdf',
  name: 'Images → PDF',
  description: 'JPG, PNG or WebP into one PDF',
  icon: mdiImageMultipleOutline,
  category: 'documents',
  runs: 'client',
  input: 'files',
  accept: ['.jpg', '.jpeg', '.png', '.webp'],
  multiple: true,
  mode: 'all',
  options: [
    {
      type: 'segmented',
      key: 'pageSize',
      label: 'Page size',
      choices: [
        { value: 'fit', label: 'Fit' },
        { value: 'a4', label: 'A4' },
        { value: 'letter', label: 'Letter' },
      ],
      default: 'fit',
    },
    { type: 'number', key: 'margin', label: 'Margin (pt)', min: 0, max: 144, step: 6, default: 0 },
  ],
};
