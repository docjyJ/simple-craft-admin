import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { resolveSafePath } from '~/server/path-validation';
import JSZip from 'jszip';

export type FolderEntry = {
  name: string;
  type: 'folder' | 'archive' | 'file';
};

async function buildZipTree(path: string) {
  const buffer = await readFile(path);
  const zip = await JSZip.loadAsync(buffer);
  const tree: string[] = [];
  zip.forEach((relativePath) => tree.push(relativePath));
  return tree;
}

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
    const tree = await buildZipTree(fullPath);
    return { type: 'archive' as const, tree };
  } else {
    const content = await readFile(fullPath, 'utf-8');
    return { type: 'file' as const, content };
  }
}

export async function saveFile(uid: string, filePath: string, content: string) {
  const fullPath = resolveSafePath(uid, filePath);
  await writeFile(fullPath, content, 'utf-8');
}
