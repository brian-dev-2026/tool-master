import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { EngineStatus } from './hints';
import { runProcess } from './spawn';

export { ENGINE_HINTS, type EngineStatus } from './hints';

const PROGRAM_FILES = [process.env.ProgramFiles ?? 'C:\\Program Files', process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)'];

async function which(cmd: string): Promise<string | null> {
  try {
    const r = await runProcess(process.platform === 'win32' ? 'where' : 'which', [cmd], { timeoutMs: 5000 });
    const first = r.stdout.split(/\r?\n/).find(Boolean);
    return r.code === 0 && first ? first.trim() : null;
  } catch {
    return null;
  }
}

export async function findLibreOffice(programFilesRoots = PROGRAM_FILES): Promise<string | null> {
  const env = process.env.LIBREOFFICE_PATH;
  if (env && existsSync(env)) return env;
  const onPath = await which('soffice');
  if (onPath) return onPath;
  for (const root of programFilesRoots) {
    const candidate = join(root, 'LibreOffice', 'program', 'soffice.exe');
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^gs/, '').split('.').map(Number);
  const pb = b.replace(/^gs/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

export async function findGhostscript(programFilesRoots = PROGRAM_FILES, opts: { skipPath?: boolean } = {}): Promise<string | null> {
  const env = process.env.GHOSTSCRIPT_PATH;
  if (env && existsSync(env)) return env;
  if (!opts.skipPath) {
    const onPath = (await which('gswin64c')) ?? (await which('gs'));
    if (onPath) return onPath;
  }
  for (const root of programFilesRoots) {
    const gsRoot = join(root, 'gs');
    if (!existsSync(gsRoot)) continue;
    const versions = (await readdir(gsRoot)).filter((v) => /^gs\d/.test(v)).sort(compareVersions).reverse();
    for (const v of versions) {
      const candidate = join(gsRoot, v, 'bin', 'gswin64c.exe');
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

async function hasComClass(progId: string): Promise<boolean> {
  if (process.platform !== 'win32') return false;
  try {
    const r = await runProcess('reg', ['query', `HKCR\\${progId}\\CLSID`], { timeoutMs: 5000 });
    return r.code === 0;
  } catch {
    return false;
  }
}

let cached: Promise<EngineStatus> | null = null;

export function detectEngines(opts: { refresh?: boolean } = {}): Promise<EngineStatus> {
  if (!cached || opts.refresh) {
    cached = (async () => {
      const [word, excel, powerpoint, lo, gs] = await Promise.all([
        hasComClass('Word.Application'),
        hasComClass('Excel.Application'),
        hasComClass('PowerPoint.Application'),
        findLibreOffice(),
        findGhostscript(),
      ]);
      return { word, excel, powerpoint, libreoffice: lo !== null, ghostscript: gs !== null };
    })();
  }
  return cached;
}
