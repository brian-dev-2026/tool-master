import { mdiCodeBraces } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'yaml-to-json',
  name: 'YAML → JSON',
  description: 'Config files to JSON',
  icon: mdiCodeBraces,
  category: 'data',
  runs: 'client',
  input: 'text',
  accept: ['.yaml', '.yml'],
};
