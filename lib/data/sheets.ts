import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ToolError } from '@/tools/types';
import { flatten } from './flatten';

const NO_ROWS = 'This file has no rows';
const EMPTY_JSON = 'JSON is empty';
const BAD_SHAPE = 'JSON must be an array of objects or an object of arrays';

const bad = (message: string) => new ToolError(message, 'BAD_INPUT', 400);
const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

function readBook(bytes: Uint8Array | ArrayBuffer): XLSX.WorkBook {
  let book: XLSX.WorkBook;
  try {
    book = XLSX.read(bytes, { type: 'array' });
  } catch {
    throw bad('Could not read this spreadsheet');
  }
  if (!book.SheetNames.length) throw bad('Could not read this spreadsheet');
  return book;
}

function sheetRows(sheet: XLSX.WorkSheet, header: boolean): unknown[] {
  return header ? XLSX.utils.sheet_to_json(sheet) : XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
}

export function listSheets(bytes: Uint8Array | ArrayBuffer): string[] {
  return readBook(bytes).SheetNames;
}

/** sheet '__first__' → rows of the first sheet; '__all__' → { [sheetName]: rows }. */
export function excelToJson(bytes: Uint8Array | ArrayBuffer, opts: { sheet: '__first__' | '__all__'; header: boolean }): unknown {
  const book = readBook(bytes);
  if (opts.sheet === '__all__') {
    const all = Object.fromEntries(book.SheetNames.map((name) => [name, sheetRows(book.Sheets[name], opts.header)]));
    if (Object.values(all).every((rows) => rows.length === 0)) throw bad(NO_ROWS);
    return all;
  }
  const rows = sheetRows(book.Sheets[book.SheetNames[0]], opts.header);
  if (!rows.length) throw bad(NO_ROWS);
  return rows;
}

function rowsOf(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value) || !value.every(isRecord)) throw bad(BAD_SHAPE);
  return value.map((row) => flatten(row));
}

/** Array of objects → one sheet; object of arrays → one sheet per key. */
export function jsonToWorkbook(data: unknown): ArrayBuffer {
  const book = XLSX.utils.book_new();
  if (Array.isArray(data)) {
    if (!data.length) throw bad(EMPTY_JSON);
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rowsOf(data)), 'Sheet1');
  } else if (isRecord(data)) {
    const entries = Object.entries(data);
    if (!entries.length) throw bad(EMPTY_JSON);
    for (const [name, rows] of entries) XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rowsOf(rows)), name.slice(0, 31) || 'Sheet');
  } else {
    throw bad(BAD_SHAPE);
  }
  return XLSX.write(book, { type: 'array', bookType: 'xlsx' });
}

export function rowsToWorkbook(rows: unknown[][]): ArrayBuffer {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), 'Sheet1');
  return XLSX.write(book, { type: 'array', bookType: 'xlsx' });
}

export function workbookToCsvs(bytes: Uint8Array | ArrayBuffer): { sheet: string; csv: string }[] {
  const book = readBook(bytes);
  const csvs = book.SheetNames.map((sheet) => ({ sheet, csv: XLSX.utils.sheet_to_csv(book.Sheets[sheet], { RS: '\r\n', blankrows: false }) }));
  if (csvs.every((c) => !c.csv.trim())) throw bad(NO_ROWS);
  return csvs;
}

export function csvToRows(text: string): unknown[][] {
  if (!text.trim()) throw bad(NO_ROWS);
  const rows = Papa.parse<unknown[]>(text.trim(), { dynamicTyping: true, skipEmptyLines: true }).data;
  if (!rows.length) throw bad(NO_ROWS);
  return rows;
}

export function rowsToCsv(rows: unknown[][]): string {
  return Papa.unparse(rows);
}

export function csvToJson(text: string, opts: { header: boolean }): unknown[] {
  if (!opts.header) return csvToRows(text);
  if (!text.trim()) throw bad(NO_ROWS);
  const rows = Papa.parse<Record<string, unknown>>(text.trim(), { header: true, dynamicTyping: true, skipEmptyLines: true }).data;
  if (!rows.length) throw bad(NO_ROWS);
  return rows;
}

export function jsonToCsv(data: unknown): string {
  if (Array.isArray(data) && !data.length) throw bad(EMPTY_JSON);
  if (!Array.isArray(data) || !data.every(isRecord)) throw bad('JSON must be an array of objects');
  const rows = data.map((row) => flatten(row));
  const fields = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return Papa.unparse({ fields, data: rows.map((row) => fields.map((f) => row[f] ?? '')) });
}
