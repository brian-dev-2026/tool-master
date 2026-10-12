import type { ClientTool } from './types';

export const clientLoaders: Record<string, () => Promise<{ default: ClientTool }>> = {
  'merge-pdf': () => import('./merge-pdf/client'),
  'split-pdf': () => import('./split-pdf/client'),
  'images-to-pdf': () => import('./images-to-pdf/client'),
  'pdf-to-images': () => import('./pdf-to-images/client'),
  'rotate-pdf': () => import('./rotate-pdf/client'),
  'organize-pdf': () => import('./organize-pdf/client'),
  'page-numbers': () => import('./page-numbers/client'),
  'watermark-pdf': () => import('./watermark-pdf/client'),
};
