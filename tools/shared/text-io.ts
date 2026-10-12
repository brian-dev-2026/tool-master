import type { ToolInput, ToolOutput } from '../types';

export function inputText(input: ToolInput): string {
  if (!('text' in input)) throw new Error('No text');
  return input.text;
}

export function textOutput(text: string, filename: string, mime: string): ToolOutput {
  return { kind: 'text', text, filename, mime };
}
