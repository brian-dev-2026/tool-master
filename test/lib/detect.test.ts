import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectEngines, findGhostscript, findLibreOffice } from '@/lib/engines/detect';

const saved = { ...process.env };
afterEach(() => {
  process.env = { ...saved };
});

describe('findLibreOffice', () => {
  it('uses LIBREOFFICE_PATH when the file exists', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tm-test-'));
    const exe = join(dir, 'soffice.exe');
    await writeFile(exe, '');
    process.env.LIBREOFFICE_PATH = exe;
    expect(await findLibreOffice()).toBe(exe);
  });

  it('falls through when LIBREOFFICE_PATH points at a missing file', async () => {
    process.env.LIBREOFFICE_PATH = join(tmpdir(), 'definitely-missing', 'soffice.exe');
    await expect(findLibreOffice()).resolves.not.toBe(process.env.LIBREOFFICE_PATH);
  });
});

describe('findGhostscript', () => {
  it('picks the newest installed version by number, not by text', async () => {
    delete process.env.GHOSTSCRIPT_PATH;
    const root = await mkdtemp(join(tmpdir(), 'tm-pf-'));
    for (const v of ['gs9.56.1', 'gs10.03.0']) {
      await mkdir(join(root, 'gs', v, 'bin'), { recursive: true });
      await writeFile(join(root, 'gs', v, 'bin', 'gswin64c.exe'), '');
    }
    const found = await findGhostscript([root], { skipPath: true });
    expect(found).toBe(join(root, 'gs', 'gs10.03.0', 'bin', 'gswin64c.exe'));
  });
});

describe('detectEngines', () => {
  it('reports every engine as a boolean and caches the result', async () => {
    const first = await detectEngines();
    expect(Object.keys(first).sort()).toEqual(['excel', 'ghostscript', 'libreoffice', 'powerpoint', 'word']);
    for (const v of Object.values(first)) expect(typeof v).toBe('boolean');
    expect(await detectEngines()).toBe(first);
  });
});
