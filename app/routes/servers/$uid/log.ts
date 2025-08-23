import type { Route } from './+types/log';
import { getMinecraftServerLog } from '~/server/minecraft-servers';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { uid } = params;
  const url = new URL(request.url);
  const clientLines = parseInt(url.searchParams.get('lines') ?? '0', 10) ?? 0;

  const log = await getMinecraftServerLog(uid, clientLines);

  return new Response(JSON.stringify(log), { headers: { 'Content-Type': 'application/json' } });
}
