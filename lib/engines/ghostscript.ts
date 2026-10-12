import { JOB_TIMEOUT_MS } from '@/lib/config';
import { ToolError } from '@/tools/types';
import { findGhostscript } from './detect';
import { ENGINE_HINTS } from './hints';
import { getQueue } from './queue';
import { runProcess } from './spawn';

export type CompressLevel = 'strong' | 'balanced' | 'light';

const PRESETS: Record<CompressLevel, string> = { strong: '/screen', balanced: '/ebook', light: '/printer' };

export function gsArgs(level: CompressLevel, input: string, output: string): string[] {
  return [
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.5',
    `-dPDFSETTINGS=${PRESETS[level] ?? PRESETS.balanced}`,
    '-dSAFER',
    '-dNOPAUSE',
    '-dBATCH',
    '-dQUIET',
    `-sOutputFile=${output}`,
    input,
  ];
}

export async function ghostscriptCompress(input: string, output: string, level: CompressLevel, signal: AbortSignal): Promise<void> {
  const gs = await findGhostscript();
  if (!gs) throw new ToolError(`Ghostscript not found. Install it from ${ENGINE_HINTS.ghostscript.url.replace(/^https:\/\//, '')}`, 'ENGINE_MISSING', 503);
  const result = await getQueue('ghostscript').run(() => runProcess(gs, gsArgs(level, input, output), { timeoutMs: JOB_TIMEOUT_MS, signal }));
  if (result.code !== 0) {
    const reason = result.stderr.trim().split(/\r?\n/)[0];
    throw new ToolError(`Could not compress this PDF${reason ? ` (${reason})` : ''}`);
  }
}
