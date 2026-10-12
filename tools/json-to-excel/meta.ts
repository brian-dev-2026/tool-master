import { mdiMicrosoftExcel } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'json-to-excel',
  name: 'JSON → Excel',
  description: 'Arrays of objects to a spreadsheet',
  icon: mdiMicrosoftExcel,
  category: 'data',
  runs: 'client',
  input: 'files',
  accept: ['.json'],
  multiple: true,
  pasteable: true,
};
