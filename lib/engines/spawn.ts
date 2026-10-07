import { spawn } from 'node:child_process';
import { ToolError } from '@/tools/types';

export interface ProcessResult {
  stdout: string;
  stderr: string;
  code: number;
}

export function killTree(pid: number): void {
  if (process.platform === 'win32') {
    spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  } else {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {}
    }
  }
}

/** Runs a command without a shell; arguments are never interpolated into a command string. */
export function runProcess(
  cmd: string,
  args: string[],
  opts: { cwd?: string; timeoutMs: number; signal?: AbortSignal },
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      windowsHide: true,
      detached: process.platform !== 'win32',
    });
    let stdout = '';
    let stderr = '';
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      opts.signal?.removeEventListener('abort', onAbort);
      fn();
    };
    const stop = (error: ToolError) => {
      if (child.pid) killTree(child.pid);
      finish(() => reject(error));
    };
    const onAbort = () => stop(new ToolError('Timed out', 'TIMEOUT', 500));
    const timer = setTimeout(onAbort, opts.timeoutMs);
    opts.signal?.addEventListener('abort', onAbort);

    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', (err) => finish(() => reject(err)));
    child.on('close', (code) => finish(() => resolve({ stdout, stderr, code: code ?? -1 })));
  });
}
