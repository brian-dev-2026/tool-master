'use client';

import { useCallback, useState } from 'react';
import { clientLoaders } from '@/tools/client-loaders';
import type { Options, ToolMeta } from '@/tools/types';
import { downloadBlob } from './download';
import { errorMessage, newId, runClientTool, toFiles, type QueueEvent, type QueueItem } from './run-client';
import { runServerTool } from './run-server';
import { defaultOptions, validateFiles } from './validate';
import { zipOutputs } from './zip';

export function useToolRunner(meta: ToolMeta) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [options, setOptions] = useState<Options>(() => defaultOptions(meta));
  const [staged, setStaged] = useState<File[]>([]);

  const apply = useCallback((event: QueueEvent) => {
    setItems((prev) => {
      const index = prev.findIndex((i) => i.id === event.id);
      if (index === -1) return [...prev, { label: '', status: 'waiting', ...event } as QueueItem];
      const next = prev.slice();
      next[index] = { ...next[index], ...event };
      return next;
    });
  }, []);

  const consume = useCallback(
    async (events: AsyncGenerator<QueueEvent>) => {
      for await (const event of events) apply(event);
    },
    [apply],
  );

  const runFiles = useCallback(
    async (files: File[]) => {
      if (meta.runs === 'server') {
        await consume(runServerTool(meta, files, options));
        return;
      }
      const tool = (await clientLoaders[meta.slug]()).default;
      await consume(runClientTool(meta, tool, files, options));
    },
    [meta, options, consume],
  );

  const addFiles = useCallback(
    async (files: File[]) => {
      const { ok, rejected } = validateFiles(files, meta);
      for (const r of rejected) apply({ id: newId(), label: r.file.name, size: r.file.size, status: 'failed', error: r.reason });
      if (!ok.length) return;
      // 'all' tools (merge, images → PDF) wait so the person can order the files first.
      if (meta.mode === 'all') {
        setStaged((prev) => [...prev, ...ok]);
        return;
      }
      await runFiles(ok);
    },
    [meta, apply, runFiles],
  );

  const runStaged = useCallback(async () => {
    const files = staged;
    setStaged([]);
    await runFiles(files);
  }, [staged, runFiles]);

  const runText = useCallback(
    async (text: string) => {
      const id = newId();
      setItems([{ id, label: 'Result', status: 'working' }]);
      try {
        const tool = (await clientLoaders[meta.slug]()).default;
        const output = await tool.run({ text }, options);
        setItems([{ id, label: 'Result', status: 'done', outputs: toFiles(output) }]);
        return output;
      } catch (err) {
        setItems([{ id, label: 'Result', status: 'failed', error: errorMessage(err) }]);
        return null;
      }
    },
    [meta, options],
  );

  const clear = useCallback(() => setItems([]), []);

  const downloadAll = useCallback(async () => {
    const outputs = items.flatMap((i) => i.outputs ?? []);
    if (outputs.length === 1) downloadBlob(outputs[0].data, outputs[0].name);
    else if (outputs.length > 1) downloadBlob(await zipOutputs(outputs), `${meta.slug}.zip`);
  }, [items, meta.slug]);

  return { items, options, setOptions, addFiles, runText, clear, downloadAll, staged, setStaged, runStaged };
}
