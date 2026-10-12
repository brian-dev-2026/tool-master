import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as XLSX from 'xlsx';
import { parseJsonStrict } from '@/lib/data/json';
import { flatten } from '@/lib/data/flatten';
import { csvToJson, csvToRows, excelToJson, jsonToCsv, jsonToWorkbook, listSheets, rowsToCsv, workbookToCsvs } from '@/lib/data/sheets';

const fixture = (name: string) => readFileSync(join(__dirname, '..', 'fixtures', name));
const bytes = (name: string) => new Uint8Array(fixture(name));
const text = (name: string) => fixture(name).toString('utf8');

describe('parseJsonStrict', () => {
  it('reports the line and column of a syntax error', () => {
    expect(() => parseJsonStrict('{\n "a": 1,\n}')).toThrow('Invalid JSON: line 3, column 1');
  });

  it('rejects whitespace-only input as empty', () => {
    expect(() => parseJsonStrict('  \n ')).toThrow('JSON is empty');
  });
});

describe('excelToJson', () => {
  it('reads the first sheet as objects when the first row is a header', () => {
    expect(excelToJson(bytes('two-sheets.xlsx'), { sheet: '__first__', header: true })).toEqual([
      { name: 'Ana', age: 30 },
      { name: 'Ben', age: 25 },
    ]);
  });

  it('reads rows as arrays without a header', () => {
    expect(excelToJson(bytes('two-sheets.xlsx'), { sheet: '__first__', header: false })).toEqual([['name', 'age'], ['Ana', 30], ['Ben', 25]]);
  });

  it('returns every sheet keyed by name', () => {
    expect(excelToJson(bytes('two-sheets.xlsx'), { sheet: '__all__', header: true })).toEqual({
      People: [{ name: 'Ana', age: 30 }, { name: 'Ben', age: 25 }],
      Cities: [{ city: 'Lisbon' }, { city: 'Manila' }],
    });
  });

  it('lists sheet names', () => {
    expect(listSheets(bytes('two-sheets.xlsx'))).toEqual(['People', 'Cities']);
  });

  it('explains a damaged spreadsheet', () => {
    expect(() => excelToJson(bytes('garbage.xlsx'), { sheet: '__first__', header: true })).toThrow('Could not read this spreadsheet');
  });
});

describe('jsonToWorkbook', () => {
  it('round-trips an array of objects', () => {
    const book = jsonToWorkbook([{ a: 1 }]);
    expect(excelToJson(new Uint8Array(book), { sheet: '__first__', header: true })).toEqual([{ a: 1 }]);
  });

  it('makes one sheet per key for an object of arrays', () => {
    const wb = XLSX.read(jsonToWorkbook({ S1: [{ a: 1 }], S2: [{ b: 2 }] }));
    expect(wb.SheetNames).toEqual(['S1', 'S2']);
  });

  it.each([
    ['[]', 'JSON is empty'],
    ['{}', 'JSON is empty'],
    ['"str"', 'JSON must be an array of objects or an object of arrays'],
    ['[1, 2]', 'JSON must be an array of objects or an object of arrays'],
  ])('rejects %s', (input, message) => {
    expect(() => jsonToWorkbook(JSON.parse(input))).toThrow(message);
  });
});

describe('CSV', () => {
  it('auto-detects semicolons and types numbers', () => {
    expect(csvToJson(text('semicolon.csv'), { header: true })).toEqual([
      { name: 'Ana', age: 30, city: 'Lisbon' },
      { name: 'Ben', age: 25, city: 'Manila' },
    ]);
  });

  it('returns arrays without a header', () => {
    expect(csvToJson(text('people.csv'), { header: false })).toEqual([['name', 'age'], ['Ana', 30], ['Ben', 25]]);
  });

  it('round-trips rows', () => {
    expect(csvToRows(rowsToCsv([['a', 'b, c'], [1, 2]]))).toEqual([['a', 'b, c'], [1, 2]]);
  });

  it('explains an empty CSV', () => {
    expect(() => csvToJson(text('empty.csv'), { header: true })).toThrow('This file has no rows');
    expect(() => csvToRows('')).toThrow('This file has no rows');
  });

  it('flattens nested objects and stringifies arrays', () => {
    expect(jsonToCsv([{ a: { b: 1 }, c: [1, 2] }])).toBe('a.b,c\r\n1,"[1,2]"');
  });

  it('rejects JSON that is not an array of objects', () => {
    expect(() => jsonToCsv([])).toThrow('JSON is empty');
    expect(() => jsonToCsv({ a: 1 })).toThrow('JSON must be an array of objects');
  });

  it('turns every sheet of a workbook into its own CSV', () => {
    expect(workbookToCsvs(bytes('two-sheets.xlsx'))).toEqual([
      { sheet: 'People', csv: 'name,age\r\nAna,30\r\nBen,25' },
      { sheet: 'Cities', csv: 'city\r\nLisbon\r\nManila' },
    ]);
  });
});

describe('flatten', () => {
  it('uses dot keys for nested objects', () => {
    expect(flatten({ a: { b: { c: 1 } }, d: 2 })).toEqual({ 'a.b.c': 1, d: 2 });
  });
});

describe('rowsToWorkbook', () => {
  it('writes rows as-is into one sheet', async () => {
    const { rowsToWorkbook } = await import('@/lib/data/sheets');
    const book = rowsToWorkbook([['name', 'age'], ['Ana', 30]]);
    expect(excelToJson(new Uint8Array(book), { sheet: '__first__', header: true })).toEqual([{ name: 'Ana', age: 30 }]);
  });
});
