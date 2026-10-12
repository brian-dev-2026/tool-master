import type { ClientTool } from './types';

export const clientLoaders: Record<string, () => Promise<{ default: ClientTool }>> = {
  'merge-pdf': () => import('./merge-pdf/client'),
  'split-pdf': () => import('./split-pdf/client'),
  'images-to-pdf': () => import('./images-to-pdf/client'),
};
