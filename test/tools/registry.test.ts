import { describe, expect, it } from 'vitest';
import { tools, getTool } from '@/tools/registry';
import { clientLoaders } from '@/tools/client-loaders';
import { serverLoaders } from '@/tools/server-loaders';
import { uiLoaders } from '@/tools/ui-loaders';

export const EXPECTED_COUNT = 0;

describe('tool registry', () => {
  it('has the v1 count', () => {
    expect(tools.length).toBe(EXPECTED_COUNT);
  });

  it('has unique, url-safe slugs', () => {
    const slugs = tools.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it('has an implementation for every tool', () => {
    for (const t of tools) {
      if (t.runs === 'client') expect(clientLoaders, t.slug).toHaveProperty([t.slug]);
      if (t.runs === 'server') expect(serverLoaders, t.slug).toHaveProperty([t.slug]);
      if (t.customUi) expect(uiLoaders, t.slug).toHaveProperty([t.slug]);
    }
  });

  it('declares accepted extensions for file tools', () => {
    for (const t of tools) {
      if (t.input === 'files') expect(t.accept?.length, t.slug).toBeGreaterThan(0);
      for (const ext of t.accept ?? []) expect(ext, t.slug).toMatch(/^\./);
    }
  });

  it('has unique option keys per tool', () => {
    for (const t of tools) {
      const keys = (t.options ?? []).map((o) => o.key);
      expect(new Set(keys).size, t.slug).toBe(keys.length);
    }
  });

  it('looks tools up by slug', () => {
    expect(getTool('does-not-exist')).toBeUndefined();
    for (const t of tools) expect(getTool(t.slug)).toBe(t);
  });
});
