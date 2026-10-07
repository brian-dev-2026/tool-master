import type { Options, ToolMeta } from '@/tools/types';
import { formatBytes } from './download';
import { errorMessage, newId, type QueueEvent } from './run-client';

/** "attachment; filename*=UTF-8''..." → decoded name, falling back to the plain filename. */
export function filenameFromHeader(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star) return decodeURIComponent(star[1]);
  const plain = /filename="([^"]+)"/i.exec(header);
  return plain ? plain[1] : fallback;
}

/** Sends one request per file so each file gets its own progress and error. */
export async function* runServerTool(meta: ToolMeta, files: File[], options: Options): AsyncGenerator<QueueEvent> {
  const jobs = files.map((file) => ({ id: newId(), file }));
  for (const j of jobs) yield { id: j.id, label: j.file.name, size: j.file.size, status: 'waiting' };

  for (const { id, file } of jobs) {
    yield { id, status: 'working' };
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('options', JSON.stringify(options));
      const res = await fetch(`/api/tools/${meta.slug}`, { method: 'POST', body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }
      const data = await res.blob();
      const name = filenameFromHeader(res.headers.get('content-disposition'), file.name);
      const original = Number(res.headers.get('x-original-size'));
      const note =
        meta.slug.startsWith('compress') && original
          ? data.size >= original
            ? 'Already optimized'
            : `${formatBytes(original)} → ${formatBytes(data.size)} (−${Math.round((1 - data.size / original) * 100)}%)`
          : undefined;
      yield { id, status: 'done', outputs: [{ name, data }], note };
    } catch (err) {
      yield { id, status: 'failed', error: errorMessage(err) };
    }
  }
}
