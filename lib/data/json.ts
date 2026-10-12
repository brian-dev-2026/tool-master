import { ToolError } from '@/tools/types';

function lineColumn(text: string, position: number): [number, number] {
  const before = text.slice(0, position).split('\n');
  return [before.length, before[before.length - 1].length + 1];
}

/** JSON.parse with errors a person can act on: "Invalid JSON: line 3, column 1". */
export function parseJsonStrict(text: string): unknown {
  if (!text.trim()) throw new ToolError('JSON is empty', 'BAD_INPUT', 400);
  try {
    return JSON.parse(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    // V8: "... (line 3 column 1)"; Firefox: "... at line 3 column 1 of the JSON data".
    const lc = /line (\d+) column (\d+)/i.exec(message);
    const pos = /position (\d+)/i.exec(message);
    const [line, column] = lc ? [Number(lc[1]), Number(lc[2])] : pos ? lineColumn(text, Number(pos[1])) : lineColumn(text, text.length);
    throw new ToolError(`Invalid JSON: line ${line}, column ${column}`, 'BAD_INPUT', 400);
  }
}
