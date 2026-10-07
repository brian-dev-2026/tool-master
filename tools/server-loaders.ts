import type { ServerTool } from './types';

export const serverLoaders: Record<string, () => Promise<{ default: ServerTool }>> = {};
