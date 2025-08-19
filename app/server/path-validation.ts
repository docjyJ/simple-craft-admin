import { resolve, relative } from 'node:path';

export const root = resolve('./minecraft/servers');

export function isValidUid(uid: string): boolean {
  return /^[a-zA-Z0-9-]+$/.test(uid);
}

function outOfRoot(path: string): boolean {
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

export function resolveSafePath(uid: string, pathInput: string): string {
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

export function getRelativePath(uid: string, fullPath: string): string {
  return '/' + relative(resolve(root, uid), fullPath);
}
