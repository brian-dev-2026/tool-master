import { describe, expect, it } from 'vitest';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { handleToolRequest } from '@/lib/server/handle-request';
import { ToolError, type ServerTool, type ToolMeta } from '@/tools/types';

const serverMeta: ToolMeta = {
  slug: 'fake', name: 'Fake', description: '', icon: '', category: 'documents',
  runs: 'server', input: 'files', accept: ['.docx'],
};
const clientMeta: ToolMeta = { ...serverMeta, slug: 'client-only', runs: 'client' };

function deps(tool: ServerTool) {
  const metas: Record<string, ToolMeta> = { fake: serverMeta, 'client-only': clientMeta };
  return {
    getTool: (slug: string) => metas[slug],
    serverLoaders: { fake: async () => ({ default: tool }) },
  };
}

const okTool: ServerTool = {
  async run(_input, originalName, _options, job) {
    const path = join(job.dir, 'out.txt');
    await writeFile(path, 'converted');
    return { path, name: originalName.replace(/\.docx$/, '.txt'), mime: 'text/plain' };
  },
};

function request(file?: File, options?: string) {
  const form = new FormData();
  if (file) form.set('file', file);
  if (options !== undefined) form.set('options', options);
  return new Request('http://localhost/api/tools/fake', { method: 'POST', body: form });
}

const docx = (name = 'a.docx', bytes = 4) => new File([new Uint8Array(bytes)], name);

describe('handleToolRequest', () => {
  it('404s an unknown slug', async () => {
    const res = await handleToolRequest(request(docx()), 'nope', deps(okTool));
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('404s a client-side tool', async () => {
    expect((await handleToolRequest(request(docx()), 'client-only', deps(okTool))).status).toBe(404);
  });

  it('400s a missing file', async () => {
    const res = await handleToolRequest(request(), 'fake', deps(okTool));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'BAD_INPUT' });
  });

  it('400s the wrong extension', async () => {
    expect((await handleToolRequest(request(docx('a.txt')), 'fake', deps(okTool))).status).toBe(400);
  });

  it('400s malformed options JSON', async () => {
    expect((await handleToolRequest(request(docx(), '{bad'), 'fake', deps(okTool))).status).toBe(400);
  });

  it('413s files over the limit', async () => {
    const res = await handleToolRequest(request(docx('a.docx', 51 * 1024 * 1024)), 'fake', deps(okTool));
    expect(res.status).toBe(413);
    expect(await res.json()).toMatchObject({ code: 'TOO_LARGE' });
  });

  it('streams the result with a download header and the original size', async () => {
    const res = await handleToolRequest(request(docx("José's.docx", 7)), 'fake', deps(okTool));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('converted');
    expect(res.headers.get('content-disposition')).toContain("filename*=UTF-8''Jos%C3%A9%27s.txt");
    expect(res.headers.get('x-original-size')).toBe('7');
  });

  it('passes ToolError status and code through', async () => {
    const tool: ServerTool = { async run() { throw new ToolError('LibreOffice not found', 'ENGINE_MISSING', 503); } };
    const res = await handleToolRequest(request(docx()), 'fake', deps(tool));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'LibreOffice not found', code: 'ENGINE_MISSING' });
  });

  it('maps unexpected errors to 500 CONVERSION_FAILED', async () => {
    const tool: ServerTool = { async run() { throw new Error('kaboom'); } };
    const res = await handleToolRequest(request(docx()), 'fake', deps(tool));
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ code: 'CONVERSION_FAILED' });
  });
});
