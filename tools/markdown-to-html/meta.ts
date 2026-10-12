import { mdiLanguageMarkdownOutline } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'markdown-to-html',
  name: 'Markdown → HTML',
  description: 'Live preview, copy or download',
  icon: mdiLanguageMarkdownOutline,
  category: 'data',
  runs: 'client',
  input: 'text',
  accept: ['.md', '.markdown'],
  customUi: true,
  wide: true,
};
