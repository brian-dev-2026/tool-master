import { mdiWatermark } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'watermark-pdf',
  name: 'Add Watermark',
  description: 'Stamp text across every page',
  icon: mdiWatermark,
  category: 'documents',
  runs: 'client',
  input: 'files',
  accept: ['.pdf'],
  multiple: true,
  options: [
    { type: 'text', key: 'text', label: 'Text', default: 'CONFIDENTIAL', placeholder: 'CONFIDENTIAL' },
    { type: 'number', key: 'fontSize', label: 'Size', min: 8, max: 200, step: 2, default: 48 },
    { type: 'range', key: 'opacity', label: 'Opacity', min: 0.05, max: 1, step: 0.05, default: 0.2 },
    { type: 'number', key: 'rotation', label: 'Angle', min: -90, max: 90, step: 5, default: 45 },
    { type: 'color', key: 'color', label: 'Color', default: '#EF4444' },
  ],
};
