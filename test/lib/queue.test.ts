import { describe, expect, it } from 'vitest';
import { getQueue } from '@/lib/engines/queue';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('getQueue', () => {
  it('runs jobs on the same queue one at a time', async () => {
    const log: string[] = [];
    const q = getQueue('test-serial');
    const job = (name: string) => q.run(async () => {
      log.push(`start ${name}`);
      await sleep(20);
      log.push(`end ${name}`);
    });
    await Promise.all([job('a'), job('b')]);
    expect(log).toEqual(['start a', 'end a', 'start b', 'end b']);
  });

  it('lets different queues overlap', async () => {
    const log: string[] = [];
    const job = (queue: string) => getQueue(queue).run(async () => {
      log.push(`start ${queue}`);
      await sleep(20);
      log.push(`end ${queue}`);
    });
    await Promise.all([job('test-x'), job('test-y')]);
    expect(log.slice(0, 2).sort()).toEqual(['start test-x', 'start test-y']);
  });

  it('keeps running after a job rejects', async () => {
    const q = getQueue('test-reject');
    const failed = q.run(async () => {
      throw new Error('first failed');
    });
    const next = q.run(async () => 'second ran');
    await expect(failed).rejects.toThrow('first failed');
    await expect(next).resolves.toBe('second ran');
  });
});
