import { mdiFilePowerpointOutline } from '@mdi/js';
import { engineOption } from '../shared/engine-option';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'powerpoint-to-pdf',
  name: 'PowerPoint → PDF',
  description: 'Slides to a shareable PDF',
  icon: mdiFilePowerpointOutline,
  category: 'documents',
  runs: 'server',
  input: 'files',
  accept: ['.ppt', '.pptx', '.odp'],
  multiple: true,
  options: [engineOption],
  requires: ['powerpoint', 'libreoffice'],
  engineFor: 'powerpoint',
};
