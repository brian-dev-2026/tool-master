import { describe, expect, it } from 'vitest';
import { moveItem } from '@/lib/reorder';

describe('moveItem', () => {
  it('moves an item forward', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves an item backward', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('returns an equal copy for out-of-range or no-op moves', () => {
    const list = ['a', 'b'];
    expect(moveItem(list, 1, 1)).toEqual(list);
    expect(moveItem(list, 5, 0)).toEqual(list);
    expect(moveItem(list, 0, 1)).not.toBe(list);
  });
});
