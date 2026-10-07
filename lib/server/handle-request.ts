import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JOB_TIMEOUT_MS, MAX_FILE_MB } from '@/lib/config';
import { withTempDir } from '@/lib/jobs/tempdir';
import { extOf } from '@/lib/validate';
import { getTool as registryGetTool } from '@/tools/registry';
import { serverLoaders as registryServerLoaders } from '@/tools/server-loaders';
import { ToolError, type Options, type ServerTool, type ToolMeta } from '@/tools/types';
import { contentDisposition } from './content-disposition';

interface Deps {
  getTool: (slug: string) => ToolMeta | undefined;
  serverLoaders: Record<string, () => Promise<{ default: ServerTool }>>;
}

function fail(status: number, code: string, error: string): Response {
  return Response.json({ error, code }, { status });
}

export async function handleToolRequest(
  req: Request,
  slug: string,
  deps: Deps = { getTool: registryGetTool, serverLoaders: registryServerLoaders },
): Promise<Response> {
  const meta = deps.getTool(slug);
  const loader = deps.serverLoaders[slug];
  if (!meta || meta.runs !== 'server' || !loader) return fail(404, 'NOT_FOUND', 'Unknown tool');

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, 'BAD_INPUT', 'Expected a multipart form upload');
  }

  const file = form.get('file');
  if (!(file instanceof File)) return fail(400, 'BAD_INPUT', 'No file uploaded');

  const ext = extOf(file.name);
  const accept = (meta.accept ?? []).map((a) => a.toLowerCase());
  if (accept.length && !accept.includes(ext)) return fail(400, 'BAD_INPUT', `Only ${meta.accept!.join(', ')} files`);
  if (file.size > MAX_FILE_MB * 1024 * 1024) return fail(413, 'TOO_LARGE', `Larger than ${MAX_FILE_MB} MB`);

  let options: Options;
  try {
    options = JSON.parse(String(form.get('options') ?? '{}'));
  } catch {
    return fail(400, 'BAD_INPUT', 'Options must be valid JSON');
  }

  try {
    const tool = (await loader()).default;
    return await withTempDir(async (dir) => {
      const inputPath = join(dir, `input${ext}`);
      await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));
      const result = await tool.run(inputPath, file.name, options, { dir, signal: AbortSignal.timeout(JOB_TIMEOUT_MS) });
      const body = await readFile(result.path);
      return new Response(body, {
        headers: {
          'Content-Type': result.mime,
          'Content-Disposition': contentDisposition(result.name),
          'X-Original-Size': String(file.size),
        },
      });
    });
  } catch (err) {
    if (err instanceof ToolError) return fail(err.status, err.code, err.message);
    console.error(`[tool-master] ${slug} failed:`, err);
    return fail(500, 'CONVERSION_FAILED', 'Conversion failed');
  }
}
