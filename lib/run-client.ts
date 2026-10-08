import type { ClientTool, Options, OutputFile, ToolMeta, ToolOutput } from '@/tools/types';

export interface QueueItem {
  id: string;
  label: string;
  size?: number;
  status: 'waiting' | 'working' | 'done' | 'failed';
  progress?: number;
  outputs?: OutputFile[];
  error?: string;
  note?: string;
}

export type QueueEvent = { id: string } & Partial<QueueItem>;

let counter = 0;
export function newId(): string {
  counter += 1;
  return `job-${Date.now().toString(36)}-${counter}`;
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function toFiles(output: ToolOutput): OutputFile[] {
  if (output.kind === 'files') return output.files;
  return [{ name: output.filename ?? 'output.txt', data: new Blob([output.text], { type: output.mime ?? 'text/plain' }) }];
}

export async function* runClientTool(
  meta: ToolMeta,
  tool: ClientTool,
  files: File[],
  options: Options,
): AsyncGenerator<QueueEvent> {
  const groups =
    meta.mode === 'all'
      ? [{ id: newId(), files, label: files.length === 1 ? files[0].name : `${files.length} files` }]
      : files.map((file) => ({ id: newId(), files: [file], label: file.name }));

  for (const g of groups) {
    yield { id: g.id, label: g.label, size: g.files.reduce((s, f) => s + f.size, 0), status: 'waiting' };
  }
  for (const g of groups) {
    yield { id: g.id, status: 'working' };
    try {
      const output = await tool.run({ files: g.files }, options);
      yield { id: g.id, status: 'done', outputs: toFiles(output) };
    } catch (err) {
      yield { id: g.id, status: 'failed', error: errorMessage(err) };
    }
  }
}
