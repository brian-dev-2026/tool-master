import { mdiFilePdfBox } from '@mdi/js';
import { engineOption } from '../shared/engine-option';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'word-to-pdf',
  name: 'Word → PDF',
  description: 'Via MS Office or LibreOffice',
  icon: mdiFilePdfBox,
  category: 'documents',
  runs: 'server',
  input: 'files',
  accept: ['.doc', '.docx', '.rtf', '.odt'],
  multiple: true,
  options: [engineOption],
  requires: ['word', 'libreoffice'],
  engineFor: 'word',
};
