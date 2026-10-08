import { describe, expect, it } from 'vitest';
import { runProcess } from '@/lib/engines/spawn';

describe('runProcess', () => {
  it('returns stdout and the exit code', async () => {
    const r = await runProcess(process.execPath, ['-e', 'process.stdout.write("hi")'], { timeoutMs: 10_000 });
    expect(r).toMatchObject({ stdout: 'hi', code: 0 });
  });

  it('kills a hung process and rejects with TIMEOUT', async () => {
    const started = Date.now();
    await expect(
      runProcess(process.execPath, ['-e', 'setTimeout(() => {}, 10000)'], { timeoutMs: 200 }),
    ).rejects.toMatchObject({ code: 'TIMEOUT' });
    expect(Date.now() - started).toBeLessThan(2000);
  });
});
