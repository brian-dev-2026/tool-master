import type { Category, ToolMeta } from '@/tools/types';

export const CATEGORY_LABELS: Record<Category, string> = {
  documents: 'Documents',
  data: 'Data',
  images: 'Images',
  dev: 'Dev & Text',
};

export function filterTools(tools: ToolMeta[], query: string, category: Category | 'all'): ToolMeta[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return tools.filter((tool) => {
    if (category !== 'all' && tool.category !== category) return false;
    const haystack = `${tool.name} ${tool.description}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}
