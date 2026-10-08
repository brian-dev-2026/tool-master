import type { ServerTool } from './types';

export const serverLoaders: Record<string, () => Promise<{ default: ServerTool }>> = {
  'pdf-to-word': () => import('./pdf-to-word/server'),
  'word-to-pdf': () => import('./word-to-pdf/server'),
  'excel-to-pdf': () => import('./excel-to-pdf/server'),
  'powerpoint-to-pdf': () => import('./powerpoint-to-pdf/server'),
};
