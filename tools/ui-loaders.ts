import type { ToolUi } from './types';

/** Custom tool UIs, loaded lazily on the tool page with next/dynamic. */
export const uiLoaders: Record<string, () => Promise<{ default: ToolUi }>> = {
  'rotate-pdf': () => import('./rotate-pdf/ui'),
  'organize-pdf': () => import('./organize-pdf/ui'),
  'markdown-to-html': () => import('./markdown-to-html/ui'),
};
