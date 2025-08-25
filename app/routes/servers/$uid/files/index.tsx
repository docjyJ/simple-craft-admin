import type { Route } from './+types/index';
import { getPath } from '~/server/file-explorer';
import { ArchiveViewer, DirectoryExplorer } from '~/components/file-explorer';
import { encodePathParam } from '~/utils/path-utils';
import { redirect } from 'react-router';

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path') || '';
  const file = await getPath(params.uid, path);
  if (file.type === 'file') {
    return redirect(`edit?path=${encodePathParam(path)}`);
  }
  return { file };
}

// Action supprimée (plus de sauvegarde inline)

export default function FileExplorer({ loaderData }: Route.ComponentProps) {
  const file = loaderData.file;
  switch (file.type) {
    case 'folder':
      return <DirectoryExplorer entries={file.entries} />;
    case 'archive':
      return <ArchiveViewer archiveFiles={file.tree} />;
  }
  return null;
}
