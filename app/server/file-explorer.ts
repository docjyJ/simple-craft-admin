import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { getRelativePath, resolveSafePath } from '~/server/path-validation';
import { zipFile, zipTree } from '~/server/zip-managment';

export type FolderEntry = {
  name: string;
  type: 'folder' | 'archive' | 'file';
};

export async function getPath(uid: string, inputPath: string) {
  const fullPath = resolveSafePath(uid, inputPath);
  const s = await stat(fullPath);

  if (s.isDirectory()) {
    const entries = (await readdir(fullPath, { withFileTypes: true }))
      .map((entry) => ({
        name: entry.name,
        type: entry.isDirectory()
          ? ('folder' as const)
          : entry.name.endsWith('.zip')
            ? ('archive' as const)
            : ('file' as const),
      }))
      .sort((a, b) => {
        return a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1;
      });
    return { type: 'folder' as const, entries };
  } else if (fullPath.endsWith('.zip')) {
    const tree = await zipTree(fullPath);
    return { type: 'archive' as const, tree };
  } else {
    const content = await readFile(fullPath, 'utf-8');
    return { type: 'file' as const, content };
  }
}

export async function downloadPath(uid: string, relPath: string) {
  const fullPath = resolveSafePath(uid, relPath);
  const relativePath = getRelativePath(uid, fullPath);
  const fileName = relativePath === '/' ? 'Root' : relativePath.split('/').pop() || 'Unknown';
  const s = await stat(fullPath);
  if (s.isDirectory()) {
    const content = await zipFile(fullPath);
    return {
      content,
      name: `${fileName}.zip`,
      contentType: 'application/zip',
    };
  } else {
    const content = await readFile(fullPath);
    return {
      content,
      name: fileName,
      contentType: 'application/octet-stream',
    };
  }
}

export async function saveFile(uid: string, filePath: string, content: string) {
  const fullPath = resolveSafePath(uid, filePath);
  await writeFile(fullPath, content, 'utf-8');
}

export async function uploadFiles(uid: string, targetPath: string, file: File) {
  const fullPath = resolveSafePath(uid, targetPath);
  await writeFile(`${fullPath}/${file.name}`, Buffer.from(await file.arrayBuffer()));
}
