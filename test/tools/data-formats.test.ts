// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { jsonToXml, jsonToYaml, markdownToHtml, xmlToJson, yamlToJson } from '@/lib/data/formats';

describe('XML', () => {
  it('converts XML to JSON keeping attributes', () => {
    expect(xmlToJson('<a x="1"><b>2</b></a>', { attributes: true })).toEqual({ a: { '@_x': '1', b: 2 } });
  });

  it('can drop attributes', () => {
    expect(xmlToJson('<a x="1"><b>2</b></a>', { attributes: false })).toEqual({ a: { b: 2 } });
  });

  it('explains invalid XML', () => {
    expect(() => xmlToJson('<a><b></a>', { attributes: true })).toThrow(/^Invalid XML/);
  });

  it('wraps JSON in the chosen root element', () => {
    const xml = jsonToXml({ b: 2 }, { root: 'a' });
    expect(xml).toContain('<a>');
    expect(xml).toContain('<b>2</b>');
  });
});

describe('YAML', () => {
  it('turns multi-document YAML into an array', () => {
    expect(yamlToJson('a: 1\n---\nb: 2')).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('keeps a single document as-is', () => {
    expect(yamlToJson('a: [1, 2]')).toEqual({ a: [1, 2] });
  });

  it('explains invalid YAML', () => {
    expect(() => yamlToJson('a: [')).toThrow(/^Invalid YAML: .*line 1, column 5$/);
  });

  it('writes YAML with the chosen indent', () => {
    expect(jsonToYaml({ a: { b: 1 } }, { indent: 4 })).toBe('a:\n    b: 1\n');
  });
});

describe('markdownToHtml', () => {
  it('renders markdown and strips scripts', () => {
    const html = markdownToHtml('# Hi\n<script>alert(1)</script>');
    expect(html).toContain('<h1>Hi</h1>');
    expect(html).not.toContain('<script');
  });
});
