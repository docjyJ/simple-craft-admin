import type { Route } from './+types/download';
import { resolveSafePath } from '~/server/path-validation';
import { stat, readFile, readdir } from 'node:fs/promises';
import JSZip from 'jszip';

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
  try {
    const fullPath = resolveSafePath(params.uid, path);
    const s = await stat(fullPath);
    if (s.isDirectory()) {
      const zip = new JSZip();
      await addDirToZip(fullPath, zip);
      const content = await zip.generateAsync({ type: 'nodebuffer' });
      const folderName = path === '' || path === '/' ? 'Root' : path.split('/').pop() || 'folder';
      return new Response(new Uint8Array(content), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${folderName}.zip"`,
        },
      });
    } else {
      const content = await readFile(fullPath);
      const fileName = path === '' || path === '/' ? 'Root' : path.split('/').pop() || 'file';
      return new Response(new Uint8Array(content), {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }
  } catch (e: any) {
    if (e?.code === 'ENOENT') return new Response('Not Found', { status: 404 });
    throw e;
  }
}
