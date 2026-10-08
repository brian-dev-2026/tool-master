import type { ComponentType } from 'react';

export type Category = 'documents' | 'data' | 'images' | 'dev';

export type EngineId = 'word' | 'excel' | 'powerpoint' | 'libreoffice' | 'ghostscript' | 'birefnet';

export interface Choice {
  value: string;
  label: string;
}

export type ToolOption =
  | { type: 'segmented'; key: string; label: string; choices: Choice[]; default: string }
  | { type: 'number'; key: string; label: string; min?: number; max?: number; step?: number; default: number }
  | { type: 'checkbox'; key: string; label: string; default: boolean }
  | { type: 'select'; key: string; label: string; choices: Choice[]; default: string }
  | { type: 'color'; key: string; label: string; default: string }
  | { type: 'range'; key: string; label: string; min: number; max: number; step: number; default: number }
  | { type: 'text'; key: string; label: string; default: string; placeholder?: string };

export interface ToolMeta {
  slug: string;
  name: string;
  description: string;
  /** An @mdi/js path. */
  icon: string;
  category: Category;
  runs: 'client' | 'server';
  input: 'files' | 'text' | 'none';
  accept?: string[];
  multiple?: boolean;
  /** 'each' = one run per file (default), 'all' = one run with every file. */
  mode?: 'each' | 'all';
  options?: ToolOption[];
  /** Any one of these engines is enough. */
  requires?: EngineId[];
  /** Office tools: which MS Office app the 'msoffice' engine means. */
  engineFor?: 'word' | 'excel' | 'powerpoint';
  customUi?: boolean;
}

export type Options = Record<string, string | number | boolean>;

export interface OutputFile {
  name: string;
  data: Blob;
}

export type ToolOutput =
  | { kind: 'files'; files: OutputFile[] }
  | { kind: 'text'; text: string; filename?: string; mime?: string };

export type ToolInput = { files: File[] } | { text: string };

export interface ClientTool {
  run(input: ToolInput, options: Options): Promise<ToolOutput>;
}

export interface JobContext {
  dir: string;
  signal: AbortSignal;
}

export interface ServerResult {
  path: string;
  name: string;
  mime: string;
}

export interface ServerTool {
  run(inputPath: string, originalName: string, options: Options, job: JobContext): Promise<ServerResult>;
}

export type ToolUi = ComponentType<{ meta: ToolMeta }>;

export class ToolError extends Error {
  constructor(
    message: string,
    public code = 'CONVERSION_FAILED',
    public status = 500,
  ) {
    super(message);
    this.name = 'ToolError';
  }
}
