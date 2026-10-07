import type { ClientTool } from './types';

export const clientLoaders: Record<string, () => Promise<{ default: ClientTool }>> = {};
