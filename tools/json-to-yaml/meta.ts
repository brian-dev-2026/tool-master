import { mdiFileCodeOutline } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'json-to-yaml',
  name: 'JSON → YAML',
  description: 'JSON to readable YAML',
  icon: mdiFileCodeOutline,
  category: 'data',
  runs: 'client',
  input: 'text',
  accept: ['.json'],
  options: [
    {
      type: 'segmented',
      key: 'indent',
      label: 'Indent',
      choices: [
        { value: '2', label: '2 spaces' },
        { value: '4', label: '4 spaces' },
      ],
      default: '2',
    },
  ],
};
