import { relative, resolve } from 'node:path';

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
    throw new Error(
      `Invalid uid: '${uid}'. Only alphanumeric characters, and hyphens are allowed.`,
    );
  }
  if (outOfRoot(pathInput)) {
    throw new Error(`Path '${pathInput}' is outside the root directory.`);
  }
  return resolve([root, uid, pathInput].join('/'));
}

export function getRelativePath(uid: string, fullPath: string) {
  return '/' + relative(resolve(root, uid), fullPath);
}

export function parentPath(pathInput: string) {
  return pathInput.split('/').slice(0, -1).join('/');
}

export function cleanPath(pathInput: string) {
  return (
    '/' +
    pathInput
      .split('/')
      .filter((p) => p !== '' && p !== '.')
      .join('/')
  );
}

export function encodePathParam(pathInput: string) {
  return encodeURIComponent(pathInput).replace(/%2F/g, '/');
}
