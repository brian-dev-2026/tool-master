import { baseName } from '@/lib/pdf/load';
import type { OutputFile, ToolInput } from '../types';

export const MIME = {
  json: 'application/json',
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;

export function singleFile(input: ToolInput): File {
  const file = 'files' in input ? input.files[0] : null;
  if (!file) throw new Error('No file');
  return file;
}

export function output(file: File, ext: keyof typeof MIME, data: BlobPart): OutputFile {
  return { name: `${baseName(file.name)}.${ext}`, data: new Blob([data], { type: MIME[ext] }) };
}
