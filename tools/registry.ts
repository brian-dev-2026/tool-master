import type { ToolMeta } from './types';

// Metadata only — never import tool implementations here, so the home page stays light.
export const tools: ToolMeta[] = [];

const bySlug = new Map(tools.map((t) => [t.slug, t]));

export function getTool(slug: string): ToolMeta | undefined {
  return bySlug.get(slug);
}
