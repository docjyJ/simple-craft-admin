import type { Route } from './+types/download';
import { downloadPath } from '~/server/file-explorer';

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path') || '';
  const { content, name, contentType } = await downloadPath(params.uid, path);
  return new Response(new Uint8Array(content), {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${name}"`,
    },
  });
}
