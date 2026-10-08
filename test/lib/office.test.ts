import { describe, expect, it } from 'vitest';
import { outputName, resolveEngine } from '@/lib/engines/office';
import type { EngineStatus } from '@/lib/engines/hints';

const none: EngineStatus = { word: false, excel: false, powerpoint: false, libreoffice: false, ghostscript: false };

describe('resolveEngine', () => {
  it('prefers MS Office in auto mode when the app is installed', () => {
    expect(resolveEngine('auto', 'word', { ...none, word: true, libreoffice: true })).toBe('msoffice');
  });

  it('falls back to LibreOffice in auto mode when the app is missing', () => {
    expect(resolveEngine('auto', 'excel', { ...none, libreoffice: true })).toBe('libreoffice');
  });

  it('throws ENGINE_MISSING (503) when nothing is installed', () => {
    expect(() => resolveEngine('auto', 'word', none)).toThrow(expect.objectContaining({ status: 503, code: 'ENGINE_MISSING' }));
  });

  it('never swaps an explicitly chosen engine that is missing', () => {
    expect(() => resolveEngine('msoffice', 'powerpoint', { ...none, libreoffice: true })).toThrow(
      expect.objectContaining({ status: 503, code: 'ENGINE_MISSING' }),
    );
    expect(() => resolveEngine('libreoffice', 'word', { ...none, word: true })).toThrow(expect.objectContaining({ status: 503 }));
  });
});

describe('outputName', () => {
  it('keeps the original base name and swaps the extension', () => {
    expect(outputName("Q3 report — José's.docx", 'pdf')).toBe("Q3 report — José's.pdf");
    expect(outputName('deck.final.PPTX', 'pdf')).toBe('deck.final.pdf');
    expect(outputName('noext', 'pdf')).toBe('noext.pdf');
  });
});
