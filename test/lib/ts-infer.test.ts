import { describe, expect, it } from 'vitest';
import { inferTypescript } from '@/lib/data/ts-infer';

describe('inferTypescript', () => {
  const out = inferTypescript({ id: 1, tags: ['a'], owner: { name: 'x' }, items: [{ a: 1 }, { a: 2, b: true }] });

  it('declares the root interface with primitive and array fields', () => {
    expect(out).toContain('export interface Root {');
    expect(out).toContain('  id: number;');
    expect(out).toContain('  tags: string[];');
  });

  it('names nested object types after their keys (singular for arrays)', () => {
    expect(out).toContain('  owner: Owner;');
    expect(out).toContain('export interface Owner {');
    expect(out).toContain('  items: Item[];');
    expect(out).toContain('export interface Item {');
  });

  it('marks keys missing from some array items as optional', () => {
    expect(out).toContain('  b?: boolean;');
    expect(out).toContain('  a: number;');
  });

  it('handles empty arrays, mixed arrays and null', () => {
    const t = inferTypescript({ e: [], m: [1, 'a'], n: null });
    expect(t).toContain('  e: unknown[];');
    expect(t).toContain('  m: (number | string)[];');
    expect(t).toContain('  n: null;');
  });

  it('quotes keys that are not identifiers', () => {
    expect(inferTypescript({ 'first-name': 'x' })).toContain('  "first-name": string;');
  });

  it('uses the given root name and supports a top-level array', () => {
    expect(inferTypescript([{ a: 1 }], 'User')).toContain('export type User = UserItem[];');
  });
});
