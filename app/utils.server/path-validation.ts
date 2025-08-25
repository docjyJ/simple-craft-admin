import { relative, resolve } from 'node:path';
import { cleanPath } from '~/utils/path-utils';
import { stat } from 'node:fs/promises';
import { data } from 'react-router';

export const root = resolve('./minecraft/servers');

export function isValidUid(uid: string) {
  return /^[a-zA-Z0-9-]+$/.test(uid);
}

function outOfRoot(path: string) {
  let depth = 0;
  const parts = path.split('/');
  for (const part of parts) {
    if (part === '..') {
      depth--;
      if (depth < 0) return true;
    } else if (part !== '' && part !== '.') {
      depth++;
    }
  }
  return depth < 0;
}

export function resolveSafePath(uid: string, pathInput: string) {
  if (!isValidUid(uid)) {
    throw data(`Invalid uid: '${uid}'. Only alphanumeric characters, and hyphens are allowed.`, {
      status: 400,
    });
  }
  if (outOfRoot(pathInput)) {
    throw data(`Path '${pathInput}' is outside the root directory.`, { status: 400 });
  }
  return resolve(root, `${uid}/${pathInput}`);
}

export function getRelativePath(uid: string, fullPath: string) {
  return '/' + relative(resolve(root, uid), fullPath);
}

export function getPathFromUrl(url: string): string {
  const parsedUrl = new URL(url);
  const raw = parsedUrl.searchParams.get('path') || '/';
  return cleanPath(raw);
}

export async function getStat(path: string) {
  return stat(path).catch((e) => {
    if (e?.code === 'ENOENT') throw data('Not Found', { status: 404 });
    throw e;
  });
}
