import { describe, expect, it } from 'vitest';
import { filterTools } from '@/lib/filter';
import type { ToolMeta } from '@/tools/types';

const meta = (slug: string, name: string, description: string, category: ToolMeta['category']): ToolMeta => ({
  slug, name, description, category, icon: '', runs: 'client', input: 'text',
});

const tools = [
  meta('pdf-to-word', 'PDF → Word', 'Turn PDFs into editable .docx', 'documents'),
  meta('excel-to-json', 'Excel → JSON', 'Sheets to clean JSON', 'data'),
  meta('json-formatter', 'JSON Formatter', 'Format and validate', 'dev'),
  meta('qr-code', 'QR Code', 'Generate codes from json or text', 'dev'),
];

describe('filterTools', () => {
  it('matches name and description case-insensitively', () => {
    expect(filterTools(tools, 'JSON', 'all').map((t) => t.slug)).toEqual(['excel-to-json', 'json-formatter', 'qr-code']);
  });

  it('filters by category', () => {
    expect(filterTools(tools, 'json', 'data').map((t) => t.slug)).toEqual(['excel-to-json']);
  });

  it('returns everything in order for an empty query', () => {
    expect(filterTools(tools, '', 'all')).toEqual(tools);
  });

  it('treats a whitespace-only query as empty', () => {
    expect(filterTools(tools, '   ', 'all')).toEqual(tools);
  });

  it('requires every word of a multi-word query', () => {
    expect(filterTools(tools, 'pdf word', 'all').map((t) => t.slug)).toEqual(['pdf-to-word']);
  });
});
