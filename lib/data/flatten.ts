/** { a: { b: 1 }, c: [1, 2] } → { 'a.b': 1, c: '[1,2]' } — one flat row for CSV/Excel. */
export function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) out[path] = JSON.stringify(value);
    else if (value !== null && typeof value === 'object') Object.assign(out, flatten(value as Record<string, unknown>, path));
    else out[path] = value;
  }
  return out;
}
