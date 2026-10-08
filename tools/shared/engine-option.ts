import type { ToolOption } from '../types';

export const engineOption: ToolOption = {
  type: 'segmented',
  key: 'engine',
  label: 'Engine',
  choices: [
    { value: 'auto', label: 'Auto' },
    { value: 'msoffice', label: 'MS Office' },
    { value: 'libreoffice', label: 'LibreOffice' },
  ],
  default: 'auto',
};
