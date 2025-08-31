import JSZip from 'jszip';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

async function zipDir(zip: JSZip, dirPath: string) {
  for (const entry of await readdir(dirPath, { withFileTypes: true })) {
    const path = `${dirPath}/${entry.name}`;
    if (entry.isDirectory()) await zipDir(zip.folder(entry.name)!, path);
    else await readFile(path).then((data) => zip.file(entry.name, data));
  }
}

export async function createZipFromDir(dirPath: string) {
  const zip = new JSZip();
  await zipDir(zip, dirPath);
  return zip.generateAsync({ type: 'nodebuffer' });
}

export async function extractZipToDir(buffer: Buffer, dirPath: string) {
  const zip = await JSZip.loadAsync(buffer);
  await mkdir(dirPath, { recursive: true });
  for (const entry of Object.values(zip.files)) {
    const filePath = `${dirPath}/${entry.name}`;
    if (entry.dir) {
      await mkdir(filePath, { recursive: true });
    } else {
      await mkdir(dirname(filePath), { recursive: true })
        .then(() => entry.async('nodebuffer'))
        .then((data) => writeFile(filePath, data));
    }
  }
}
