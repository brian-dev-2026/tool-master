import { existsSync } from 'node:fs';
import { mkdir, readdir, rm } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { JOB_TIMEOUT_MS } from '@/lib/config';
import { ToolError } from '@/tools/types';
import { findLibreOffice } from './detect';
import { getQueue } from './queue';
import { runProcess } from './spawn';

const PROFILE_DIR = join(process.cwd(), '.cache', 'lo-profile');

/** soffice.com is the console twin of soffice.exe on Windows: it waits for the job and reports errors. */
function consoleBinary(path: string): string {
  const com = join(dirname(path), 'soffice.com');
  return path.toLowerCase().endsWith('soffice.exe') && existsSync(com) ? com : path;
}

/** Converts `input` into `outDir`; returns the output file path. */
export async function libreofficeConvert(input: string, outDir: string, target: 'pdf' | 'docx', signal: AbortSignal): Promise<string> {
  const soffice = await findLibreOffice();
  if (!soffice) throw new ToolError('LibreOffice not found. Install it from libreoffice.org', 'ENGINE_MISSING', 503);
  await mkdir(outDir, { recursive: true });

  // One shared profile (jobs are serialised by the queue) avoids rebuilding it on every run;
  // it is wiped after a timeout so a stuck profile can never break later jobs.
  const profile = pathToFileURL(PROFILE_DIR).href;
  const args = [
    '--headless',
    '--norestore',
    '--nologo',
    `-env:UserInstallation=${profile}`,
    ...(target === 'docx' ? ['--infilter=writer_pdf_import', '--convert-to', 'docx:MS Word 2007 XML'] : ['--convert-to', 'pdf']),
    '--outdir',
    outDir,
    input,
  ];

  const result = await getQueue('libreoffice').run(async () => {
    try {
      return await runProcess(consoleBinary(soffice), args, { timeoutMs: JOB_TIMEOUT_MS, signal });
    } catch (err) {
      if (err instanceof ToolError && err.code === 'TIMEOUT') await rm(PROFILE_DIR, { recursive: true, force: true }).catch(() => {});
      throw err;
    }
  });
  const expected = join(/*turbopackIgnore: true*/ outDir, `${basename(input, extname(input))}.${target}`);
  if (existsSync(/*turbopackIgnore: true*/ expected)) return expected;

  // Fall back to whatever single file LibreOffice produced (it can normalise names).
  const produced = (await readdir(/*turbopackIgnore: true*/ outDir)).filter((f) => f.toLowerCase().endsWith(`.${target}`));
  if (produced.length === 1) return join(/*turbopackIgnore: true*/ outDir, produced[0]);
  const reason = result.stderr.trim().split(/\r?\n/).pop();
  throw new ToolError(`LibreOffice could not convert this file${reason ? ` (${reason})` : ''}`);
}
