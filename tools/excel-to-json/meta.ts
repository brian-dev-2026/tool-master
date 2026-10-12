import { mdiCodeJson } from '@mdi/js';
import type { ToolMeta } from '../types';

export const meta: ToolMeta = {
  slug: 'excel-to-json',
  name: 'Excel → JSON',
  description: 'Sheets to clean JSON',
  icon: mdiCodeJson,
  category: 'data',
  runs: 'client',
  input: 'files',
  accept: ['.xlsx', '.xls', '.ods'],
  multiple: true,
  options: [
    {
      type: 'segmented',
      key: 'sheet',
      label: 'Sheets',
      choices: [
        { value: '__first__', label: 'First sheet' },
        { value: '__all__', label: 'All sheets' },
      ],
      default: '__first__',
    },
    { type: 'checkbox', key: 'header', label: 'First row is the header', default: true },
  ],
};
