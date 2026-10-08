import { mdiFileWordOutline } from '@mdi/js';
import { engineOption } from '../shared/engine-option';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'pdf-to-word',
  name: 'PDF → Word',
  description: 'Turn PDFs into editable .docx',
  icon: mdiFileWordOutline,
  category: 'documents',
  runs: 'server',
  input: 'files',
  accept: ['.pdf'],
  multiple: true,
  options: [engineOption],
  requires: ['word', 'libreoffice'],
  engineFor: 'word',
};
