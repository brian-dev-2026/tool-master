import { mdiFileImageOutline } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'pdf-to-images',
  name: 'PDF → Images',
  description: 'Every page as PNG or JPG',
  icon: mdiFileImageOutline,
  category: 'documents',
  runs: 'client',
  input: 'files',
  accept: ['.pdf'],
  multiple: true,
  options: [
    {
      type: 'segmented',
      key: 'format',
      label: 'Format',
      choices: [
        { value: 'png', label: 'PNG' },
        { value: 'jpg', label: 'JPG' },
      ],
      default: 'png',
    },
    {
      type: 'segmented',
      key: 'scale',
      label: 'Quality',
      choices: [
        { value: '1', label: '1×' },
        { value: '2', label: '2×' },
        { value: '3', label: '3×' },
      ],
      default: '2',
    },
  ],
};
