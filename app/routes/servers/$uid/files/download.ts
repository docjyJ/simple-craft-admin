import type { Route } from './+types/download';
import { resolveSafePath } from '~/server/path-validation';
import { readdir, readFile, stat } from 'node:fs/promises';
import JSZip from 'jszip';
import { data } from 'react-router';

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

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path') || '';
  const fullPath = resolveSafePath(params.uid, path);
  const s = await stat(fullPath).catch((e) => {
    if (e?.code === 'ENOENT') throw data('Not Found', { status: 404 });
    throw e;
  });
  if (s.isDirectory()) {
    const zip = new JSZip();
    await addDirToZip(fullPath, zip);
    const content = await zip.generateAsync({ type: 'nodebuffer' });
    const folderName = path === '' || path === '/' ? 'Root' : path.split('/').pop() || 'folder';
    return data(new Uint8Array(content), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${folderName}.zip"`,
      },
    });
  } else {
    const content = await readFile(fullPath);
    const fileName = path === '' || path === '/' ? 'Root' : path.split('/').pop() || 'file';
    return data(new Uint8Array(content), {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  }
}
