import { mdiLanguageTypescript } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'json-to-typescript',
  name: 'JSON → TypeScript',
  description: 'Generate interfaces from a sample',
  icon: mdiLanguageTypescript,
  category: 'data',
  runs: 'client',
  input: 'text',
  accept: ['.json'],
  options: [{ type: 'text', key: 'rootName', label: 'Root name', default: 'Root', placeholder: 'Root' }],
};
