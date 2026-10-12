import { mdiFileDownloadOutline } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'compress-pdf',
  name: 'Compress PDF',
  description: 'Shrink PDFs for email and upload',
  icon: mdiFileDownloadOutline,
  category: 'documents',
  runs: 'server',
  input: 'files',
  accept: ['.pdf'],
  multiple: true,
  options: [
    {
      type: 'segmented',
      key: 'level',
      label: 'Compression',
      choices: [
        { value: 'strong', label: 'Strong' },
        { value: 'balanced', label: 'Balanced' },
        { value: 'light', label: 'Light' },
      ],
      default: 'balanced',
    },
  ],
  requires: ['ghostscript'],
};
