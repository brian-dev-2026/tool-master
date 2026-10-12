import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { ghostscriptCompress, type CompressLevel } from '@/lib/engines/ghostscript';
import type { ServerTool } from '../types';

/** A "compressed" file that isn't smaller is useless; hand back the original instead. */
export function keepOriginal(inputSize: number, outputSize: number): boolean {
  return outputSize >= inputSize;
}

const tool: ServerTool = {
  async run(inputPath, originalName, options, job) {
    const output = join(job.dir, 'compressed.pdf');
    await ghostscriptCompress(inputPath, output, (options.level as CompressLevel) ?? 'balanced', job.signal);
    const [inSize, outSize] = await Promise.all([stat(inputPath), stat(output)]).then((s) => s.map((x) => x.size));
    return { path: keepOriginal(inSize, outSize) ? inputPath : output, name: originalName, mime: 'application/pdf' };
  },
};

export default tool;
