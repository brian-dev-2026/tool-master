import JSZip from 'jszip';
import type { OutputFile } from '@/tools/types';

/** "a.pdf" seen twice becomes "a (2).pdf". */
export function uniqueName(name: string, taken: Set<string>): string {
  if (!taken.has(name)) return name;
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  let n = 2;
  while (taken.has(`${base} (${n})${ext}`)) n++;
  return `${base} (${n})${ext}`;
}

export async function zipOutputs(files: OutputFile[]): Promise<Blob> {
  const zip = new JSZip();
  const taken = new Set<string>();
  for (const file of files) {
    const name = uniqueName(file.name, taken);
    taken.add(name);
    zip.file(name, await file.data.arrayBuffer());
  }
  return zip.generateAsync({ type: 'blob' });
}
