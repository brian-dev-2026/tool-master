import { basename, extname, join } from 'node:path';
import { ToolError, type ServerTool } from '@/tools/types';
import { detectEngines } from './detect';
import { ENGINE_HINTS, type EngineStatus } from './hints';
import { libreofficeConvert } from './libreoffice';
import { msofficeConvert } from './msoffice';

export type OfficeApp = 'word' | 'excel' | 'powerpoint';
export type EngineChoice = 'auto' | 'msoffice' | 'libreoffice';

const MIME = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;

function missing(label: string, url: string): ToolError {
  return new ToolError(`${label} not found. Install it from ${url.replace(/^https:\/\//, '')}`, 'ENGINE_MISSING', 503);
}

export function resolveEngine(choice: EngineChoice, app: OfficeApp, status: EngineStatus): 'msoffice' | 'libreoffice' {
  if (choice === 'msoffice') {
    if (status[app]) return 'msoffice';
    throw missing(ENGINE_HINTS[app].label, ENGINE_HINTS[app].url);
  }
  if (choice === 'libreoffice') {
    if (status.libreoffice) return 'libreoffice';
    throw missing(ENGINE_HINTS.libreoffice.label, ENGINE_HINTS.libreoffice.url);
  }
  if (status[app]) return 'msoffice';
  if (status.libreoffice) return 'libreoffice';
  throw missing(`${ENGINE_HINTS[app].label} or LibreOffice`, ENGINE_HINTS.libreoffice.url);
}

export function outputName(originalName: string, ext: string): string {
  return `${basename(originalName, extname(originalName))}.${ext}`;
}

/** Shared implementation for every Office ↔ PDF tool. */
export function officeTool(app: OfficeApp, target: 'pdf' | 'docx'): ServerTool {
  return {
    async run(inputPath, originalName, options, job) {
      const choice = (options.engine as EngineChoice) ?? 'auto';
      const engine = resolveEngine(choice, app, await detectEngines());
      let path: string;
      if (engine === 'msoffice') {
        path = join(job.dir, `output.${target}`);
        await msofficeConvert(app, inputPath, path, target, job.signal);
      } else {
        path = await libreofficeConvert(inputPath, join(job.dir, 'out'), target, job.signal);
      }
      return { path, name: outputName(originalName, target), mime: MIME[target] };
    },
  };
}
