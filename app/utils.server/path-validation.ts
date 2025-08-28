import { relative, resolve } from 'node:path';
import { cleanPath, isArchive, isText } from '~/utils/path-utils';
import { stat } from 'node:fs/promises';
import { data } from 'react-router';

export const root = resolve('./minecraft/servers');

export async function throw404IfNotExist<T>(promise: Promise<T>) {
  return promise.catch((e) => {
    if (e?.code === 'ENOENT') throw data('Not Found', { status: 404 });
    throw e;
  });
}

export async function defaultIfNotExist<T>(promise: Promise<T>, defaultValue: T): Promise<T> {
  return promise.catch((e) => {
    if (e?.code === 'ENOENT') return defaultValue;
    throw e;
  });
}

export function isValidUid(uid: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uid);
}

export function outOfRoot(path: string) {
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

export async function pathExist(path: string) {
  return stat(path)
    .then(() => true)
    .catch((e) => {
      if (e?.code === 'ENOENT') return false;
      throw e;
    });
}

export async function requireDirectory(path: string) {
  const stats = await throw404IfNotExist(stat(path));
  if (!stats.isDirectory()) throw data('Bad Request: not a directory', { status: 400 });
}

export async function requireTextFile(path: string) {
  const stats = await throw404IfNotExist(stat(path));
  if (!stats.isFile() || !isText(path)) throw data('Bad Request: not a text file', { status: 400 });
}

export async function requireArchive(path: string) {
  const stats = await throw404IfNotExist(stat(path));
  if (!stats.isFile() || !isArchive(path)) throw data('Bad Request: not an archive', { status: 400 });
}

export function requireNonRoot(path: string) {
  if (path === '/') throw data('Forbidden: cannot delete root', { status: 403 });
}
