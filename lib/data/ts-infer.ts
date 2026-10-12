const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

function pascal(key: string): string {
  const name = key
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
  if (!name) return 'Item';
  return /^\d/.test(name) ? `T${name}` : name;
}

function singular(name: string): string {
  if (/ies$/.test(name)) return name.replace(/ies$/, 'y');
  if (/[^s]s$/.test(name)) return name.slice(0, -1);
  return `${name}Item`;
}

const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Infers TypeScript declarations from a JSON sample. Keys missing from some array items become optional. */
export function inferTypescript(json: unknown, rootName = 'Root'): string {
  const interfaces = new Map<string, string>();

  function reserve(hint: string): string {
    let name = hint;
    for (let n = 2; interfaces.has(name); n++) name = `${hint}${n}`;
    interfaces.set(name, '');
    return name;
  }

  function interfaceFor(objects: Record<string, unknown>[], hint: string): string {
    const name = reserve(hint);
    const keys = [...new Set(objects.flatMap((o) => Object.keys(o)))];
    const lines = keys.map((key) => {
      const holders = objects.filter((o) => key in o);
      const optional = holders.length < objects.length ? '?' : '';
      const prop = IDENTIFIER.test(key) ? key : JSON.stringify(key);
      return `  ${prop}${optional}: ${typeOf(holders.map((o) => o[key]), pascal(key))};`;
    });
    interfaces.set(name, `export interface ${name} {\n${lines.join('\n')}\n}`);
    return name;
  }

  /** The type of one slot, given every value seen in it. */
  function typeOf(values: unknown[], hint: string): string {
    const parts: string[] = [];
    const add = (t: string) => !parts.includes(t) && parts.push(t);
    const objects = values.filter(isObject);
    const arrays = values.filter(Array.isArray) as unknown[][];

    for (const v of values) {
      if (v === null) add('null');
      else if (Array.isArray(v)) add('__array__');
      else if (isObject(v)) add('__object__');
      else add(typeof v);
    }
    return parts
      .map((p) => {
        if (p === '__object__') return interfaceFor(objects, hint);
        if (p === '__array__') {
          const elements = arrays.flat();
          if (!elements.length) return 'unknown[]';
          const inner = typeOf(elements, singular(hint));
          return inner.includes('|') ? `(${inner})[]` : `${inner}[]`;
        }
        return p;
      })
      .join(' | ');
  }

  let head = '';
  if (isObject(json)) interfaceFor([json], rootName);
  else if (Array.isArray(json)) {
    const inner = json.length ? typeOf(json, `${rootName}Item`) : 'unknown';
    head = `export type ${rootName} = ${inner.includes('|') ? `(${inner})` : inner}[];`;
  } else head = `export type ${rootName} = ${typeOf([json], rootName)};`;

  return [head, ...interfaces.values()].filter(Boolean).join('\n\n') + '\n';
}
