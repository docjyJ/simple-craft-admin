// Utilities for client-side path manipulation (no filesystem access)

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
