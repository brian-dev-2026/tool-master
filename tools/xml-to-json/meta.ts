import { mdiXml } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'xml-to-json',
  name: 'XML → JSON',
  description: 'Parse XML into JSON',
  icon: mdiXml,
  category: 'data',
  runs: 'client',
  input: 'text',
  accept: ['.xml'],
  options: [{ type: 'checkbox', key: 'attributes', label: 'Keep attributes (@_ prefix)', default: true }],
};
