import { readFile, stat } from 'node:fs/promises';
import { data } from 'react-router';
import { extractEntryPath } from '~/utils/path-utils';
import { getPathFromUrl, resolveSafePath, throw404IfNotExist } from '~/utils.server/path-validation';
import { requireAuth } from '~/utils.server/session';
import { createZipFromDir } from '~/utils.server/zip';
import type { Route } from './+types/download';

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAuth(request);
  const path = getPathFromUrl(request.url);
  const fullPath = resolveSafePath(params.uid, path);
  const entryName = extractEntryPath(path)?.entryName || 'download';
  const stats = await throw404IfNotExist(stat(fullPath));
  if (stats.isDirectory()) {
    return data(new Uint8Array(await createZipFromDir(fullPath)), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${entryName}.zip"`,
      },
    });
  } else {
    return data(new Uint8Array(await readFile(fullPath)), {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${entryName}"`,
      },
    });
  }
}
