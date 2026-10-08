import { MAX_FILE_MB } from './config';
import type { Options, ToolMeta } from '@/tools/types';

export interface Rejected {
  file: File;
  reason: string;
}

export function extOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

export function validateFiles(files: File[], meta: ToolMeta, maxMb = MAX_FILE_MB): { ok: File[]; rejected: Rejected[] } {
  const accept = (meta.accept ?? []).map((a) => a.toLowerCase());
  const ok: File[] = [];
  const rejected: Rejected[] = [];
  for (const file of meta.multiple ? files : files.slice(0, 1)) {
    if (accept.length && !accept.includes(extOf(file.name))) {
      rejected.push({ file, reason: `Only ${meta.accept!.join(', ')} files` });
    } else if (file.size > maxMb * 1024 * 1024) {
      rejected.push({ file, reason: `Larger than ${maxMb} MB` });
    } else {
      ok.push(file);
    }
  }
  return { ok, rejected };
}

export function defaultOptions(meta: ToolMeta): Options {
  return Object.fromEntries((meta.options ?? []).map((o) => [o.key, o.default]));
}
