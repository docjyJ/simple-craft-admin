import type { Route } from './+types/download';
import { getPathFromUrl, resolveSafePath, throw404IfNotExist } from '~/utils.server/path-validation';
import { readdir, readFile, stat } from 'node:fs/promises';
import JSZip from 'jszip';
import { data } from 'react-router';
import { requireAuth } from '~/utils.server/session';
import { extractEntryPath } from '~/utils/path-utils';

async function addDirToZip(dir: string, zipFolder: JSZip) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      await addDirToZip(entryPath, zipFolder.folder(entry.name)!);
    } else {
      const fileData = await readFile(entryPath);
      zipFolder.file(entry.name, fileData);
    }
  }
}

async function createZipFromDir(dir: string) {
  const zip = new JSZip();
  await addDirToZip(dir, zip);
  return zip.generateAsync({ type: 'nodebuffer' });
}

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
