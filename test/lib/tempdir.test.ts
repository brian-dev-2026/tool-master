import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { mkdtemp, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { sweepTempDirs, withTempDir } from '@/lib/jobs/tempdir';

describe('withTempDir', () => {
  it('provides a tool-master- dir and removes it afterwards', async () => {
    let seen = '';
    await withTempDir(async (dir) => {
      seen = dir;
      expect(existsSync(dir)).toBe(true);
      expect(basename(dir).startsWith('tool-master-')).toBe(true);
    });
    expect(existsSync(seen)).toBe(false);
  });

  it('removes the dir and rethrows when the job throws', async () => {
    let seen = '';
    await expect(
      withTempDir(async (dir) => {
        seen = dir;
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(existsSync(seen)).toBe(false);
  });
});

describe('sweepTempDirs', () => {
  it('removes stale job dirs and keeps fresh ones', async () => {
    const stale = await mkdtemp(join(tmpdir(), 'tool-master-'));
    const fresh = await mkdtemp(join(tmpdir(), 'tool-master-'));
    const twoHoursAgo = new Date(Date.now() - 2 * 3600_000);
    await utimes(stale, twoHoursAgo, twoHoursAgo);
    await sweepTempDirs();
    expect(existsSync(stale)).toBe(false);
    expect(existsSync(fresh)).toBe(true);
  });
});
