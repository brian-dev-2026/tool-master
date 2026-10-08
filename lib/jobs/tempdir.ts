import { mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PREFIX = 'tool-master-';

export async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), PREFIX));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  }
}

/** Deletes job dirs left behind by a crash. Returns how many were removed. */
export async function sweepTempDirs(maxAgeMs = 3_600_000): Promise<number> {
  const root = tmpdir();
  let removed = 0;
  for (const name of await readdir(root)) {
    if (!name.startsWith(PREFIX)) continue;
    const path = join(root, name);
    try {
      const info = await stat(path);
      if (info.isDirectory() && Date.now() - info.mtimeMs > maxAgeMs) {
        await rm(path, { recursive: true, force: true });
        removed++;
      }
    } catch {
      // Another process may be cleaning up the same dir.
    }
  }
  return removed;
}
