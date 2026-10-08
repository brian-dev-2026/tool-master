import { detectEngines } from '@/lib/engines/detect';

export async function GET(req: Request) {
  const refresh = new URL(req.url).searchParams.get('refresh') === '1';
  return Response.json(await detectEngines({ refresh }));
}
