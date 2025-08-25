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

export function isText(path: string) {
  return TEXT_EXTENSIONS.some((ext) => path.endsWith(ext));
}

const TEXT_EXTENSIONS = [
  '.txt',
  '.properties',
  '.log',
  '.json',
  '.xml',
  '.yml',
  '.yaml',
  '.md',
  '.conf',
  '.env',
  '.ini',
  '.html',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.css',
];

const ARCHIVE_EXTENSIONS = ['.zip'];
export function isArchive(path: string) {
  return ARCHIVE_EXTENSIONS.some((ext) => path.endsWith(ext));
}
