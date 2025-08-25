import type { Route } from './+types/index';
import { getPath, saveFile } from '~/server/file-explorer';
import {
  ArchiveViewer,
  DirectoryExplorer,
  FileEditor,
  saveSchema,
} from '~/components/file-explorer';
import { parseFormData, validationError } from '@rvf/react-router';

const schema = saveSchema; // Only save handled here now

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path') || '';
  const file = await getPath(params.uid, path);
  return { file };
}

export async function action({ request, params }: Route.ActionArgs) {
  const result = await parseFormData(request, schema);
  if (result.error) {
    return validationError(result.error, result.submittedData);
  }
  await saveFile(params.uid, result.data.path, result.data.content);
  return null;
}

export default function FileExplorer({ loaderData: { file } }: Route.ComponentProps) {
  switch (file.type) {
    case 'folder':
      return <DirectoryExplorer entries={file.entries} />;
    case 'archive':
      return <ArchiveViewer archiveFiles={file.tree} />;
    case 'file':
      return <FileEditor fileContent={file.content} />;
  }
}
