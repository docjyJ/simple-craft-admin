import JSZip from 'jszip';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function zipTree(path: string) {
  const buffer = await readFile(path);
  const zip = await JSZip.loadAsync(buffer);
  const tree: string[] = [];
  zip.forEach((relativePath) => tree.push(relativePath));
  return tree;
}

export async function unzipFile(buffer: Buffer, outputPath: string) {
  const zip = await JSZip.loadAsync(buffer);
  for (const entry of Object.values(zip.files)) {
    const filePath = `${outputPath}/${entry.name}`;
    if (entry.dir) {
      await mkdir(filePath, { recursive: true });
    } else {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, await entry.async('nodebuffer'));
    }
  }
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
