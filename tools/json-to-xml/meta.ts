import { mdiCodeTags } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'json-to-xml',
  name: 'JSON → XML',
  description: 'Build pretty-printed XML',
  icon: mdiCodeTags,
  category: 'data',
  runs: 'client',
  input: 'text',
  accept: ['.json'],
  options: [{ type: 'text', key: 'root', label: 'Root element', default: 'root', placeholder: 'root' }],
};
