import { useLocation } from 'react-router';

export function urlBuilder({
  path,
  download,
}: {
  path: string;
  download?: boolean;
}): string {
  const builder = [] as string[];
  if (download) builder.push(download as any);
  builder.push(`?path=${encodeURIComponent(path).replace(/%2F/g, '/')}`);
  return builder.join('');
}

export default function useExplorerLocation() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const pathArray = (searchParams.get('path') ?? '').split('/').filter(Boolean);
  const pathString = '/' + pathArray.join('/');
  return {
    pathArray,
    pathString,
  };
}
