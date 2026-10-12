import { mdiNumeric } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'page-numbers',
  name: 'Add Page Numbers',
  description: 'Number every page of a PDF',
  icon: mdiNumeric,
  category: 'documents',
  runs: 'client',
  input: 'files',
  accept: ['.pdf'],
  multiple: true,
  options: [
    {
      type: 'select',
      key: 'position',
      label: 'Position',
      choices: [
        { value: 'bottom-center', label: 'Bottom center' },
        { value: 'bottom-right', label: 'Bottom right' },
        { value: 'bottom-left', label: 'Bottom left' },
        { value: 'top-center', label: 'Top center' },
        { value: 'top-right', label: 'Top right' },
        { value: 'top-left', label: 'Top left' },
      ],
      default: 'bottom-center',
    },
    {
      type: 'segmented',
      key: 'format',
      label: 'Format',
      choices: [
        { value: 'n', label: '1' },
        { value: 'page-n', label: 'Page 1' },
        { value: 'n-of-total', label: '1 of N' },
      ],
      default: 'n',
    },
    { type: 'number', key: 'start', label: 'Start at', min: 0, step: 1, default: 1 },
    { type: 'number', key: 'fontSize', label: 'Size', min: 6, max: 48, step: 1, default: 12 },
  ],
};
