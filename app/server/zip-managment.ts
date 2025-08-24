import JSZip from 'jszip';
import { readdir, readFile } from 'node:fs/promises';

export async function zipTree(path: string) {
  const buffer = await readFile(path);
  const zip = await JSZip.loadAsync(buffer);
  const tree: string[] = [];
  zip.forEach((relativePath) => tree.push(relativePath));
  return tree;
}

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

export async function zipFile(inputPath: string) {
  const zip = new JSZip();
  await addDirToZip(inputPath, zip);
  return zip.generateAsync({ type: 'nodebuffer' });
}
