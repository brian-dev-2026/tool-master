import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { JOB_TIMEOUT_MS } from '@/lib/config';
import { ToolError } from '@/tools/types';
import { getQueue } from './queue';
import { killTree, runProcess } from './spawn';

const SCRIPT = join(process.cwd(), 'lib', 'engines', 'msoffice.ps1');

/** Converts with Word / Excel / PowerPoint through COM automation (Windows only). */
export async function msofficeConvert(
  app: 'word' | 'excel' | 'powerpoint',
  input: string,
  output: string,
  target: 'pdf' | 'docx',
  signal: AbortSignal,
): Promise<void> {
  if (process.platform !== 'win32') throw new ToolError('MS Office is only available on Windows', 'ENGINE_MISSING', 503);

  await getQueue('msoffice').run(async () => {
    // Office is started by COM, not as our child, so its PID is reported by the script and killed explicitly.
    let officePid: number | null = null;
    try {
      const result = await runProcess(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', SCRIPT, '-App', app, '-In', input, '-Out', output, '-Target', target],
        {
          timeoutMs: JOB_TIMEOUT_MS,
          signal,
          onStdout: (chunk) => {
            const match = /PID:(\d+)/.exec(chunk);
            if (match) officePid = Number(match[1]);
          },
        },
      );
      if (result.code !== 0 || !existsSync(/*turbopackIgnore: true*/ output)) {
        const reason = result.stderr.trim().split(/\r?\n/)[0];
        throw new ToolError(`MS Office could not convert this file${reason ? ` (${reason})` : ''}`);
      }
    } catch (err) {
      if (officePid) killTree(officePid);
      throw err;
    }
  });
}
