import { describe, expect, it } from 'vitest';
import { runClientTool, type QueueEvent } from '@/lib/run-client';
import type { ClientTool, ToolMeta } from '@/tools/types';

const meta = (mode: 'each' | 'all'): ToolMeta => ({
  slug: 't', name: 'T', description: '', icon: '', category: 'data', runs: 'client',
  input: 'files', accept: ['.txt'], multiple: true, mode,
});

const files = ['1.txt', '2.txt', '3.txt'].map((n) => new File([n], n));

async function collect(gen: AsyncGenerator<QueueEvent>) {
  const events: QueueEvent[] = [];
  for await (const e of gen) events.push(e);
  return events;
}

function finalStatuses(events: QueueEvent[]) {
  const last = new Map<string, QueueEvent>();
  for (const e of events) last.set(e.id, { ...last.get(e.id), ...e });
  return [...last.values()];
}

describe('runClientTool', () => {
  it("runs each file separately in 'each' mode and keeps going after a failure", async () => {
    const tool: ClientTool = {
      async run(input) {
        const file = 'files' in input ? input.files[0] : null;
        if (file?.name === '2.txt') throw new Error('bad');
        return { kind: 'files', files: [{ name: file!.name, data: file! }] };
      },
    };
    const items = finalStatuses(await collect(runClientTool(meta('each'), tool, files, {})));
    expect(items.map((i) => i.status)).toEqual(['done', 'failed', 'done']);
    expect(items[1].error).toBe('bad');
  });

  it("runs once with every file in 'all' mode", async () => {
    let calls = 0;
    const tool: ClientTool = {
      async run(input) {
        calls++;
        expect('files' in input && input.files.length).toBe(3);
        return { kind: 'files', files: [{ name: 'merged.pdf', data: new Blob(['x']) }] };
      },
    };
    const items = finalStatuses(await collect(runClientTool(meta('all'), tool, files, {})));
    expect(calls).toBe(1);
    expect(items).toHaveLength(1);
    expect(items[0].label).toBe('3 files');
    expect(items[0].status).toBe('done');
  });
});
