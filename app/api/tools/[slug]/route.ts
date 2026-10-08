import { handleToolRequest } from '@/lib/server/handle-request';

// Node.js is the default runtime; Cache Components forbids the `runtime` segment config.
export async function POST(req: Request, { params }: RouteContext<'/api/tools/[slug]'>) {
  return handleToolRequest(req, (await params).slug);
}
