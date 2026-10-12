import DOMPurify from 'dompurify';
import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser';
import { marked } from 'marked';
import YAML from 'yaml';
import { ToolError } from '@/tools/types';

const bad = (message: string) => new ToolError(message, 'BAD_INPUT', 400);

export function xmlToJson(text: string, opts: { attributes: boolean }): unknown {
  if (!text.trim()) throw bad('XML is empty');
  const valid = XMLValidator.validate(text);
  if (valid !== true) throw bad(`Invalid XML: ${valid.err.msg} (line ${valid.err.line})`);
  return new XMLParser({ ignoreAttributes: !opts.attributes, attributeNamePrefix: '@_' }).parse(text);
}

export function jsonToXml(data: unknown, opts: { root: string }): string {
  const builder = new XMLBuilder({ format: true, ignoreAttributes: false, attributeNamePrefix: '@_', indentBy: '  ' });
  return `<?xml version="1.0" encoding="UTF-8"?>\n${builder.build({ [opts.root || 'root']: data })}`;
}

export function yamlToJson(text: string): unknown {
  if (!text.trim()) throw bad('YAML is empty');
  const docs = YAML.parseAllDocuments(text);
  const errors = 'errors' in docs ? docs.errors : docs.flatMap((d) => d.errors);
  if (errors.length) throw bad(`Invalid YAML: ${errors[0].message.split('\n')[0].replace(/:\s*$/, '')}`);
  const values = (docs as YAML.Document[]).map((d) => d.toJSON());
  return values.length === 1 ? values[0] : values;
}

export function jsonToYaml(data: unknown, opts: { indent: number }): string {
  return YAML.stringify(data, { indent: opts.indent });
}

/** Markdown → HTML with anything executable removed. */
export function markdownToHtml(md: string): string {
  return DOMPurify.sanitize(marked.parse(md, { async: false }));
}
