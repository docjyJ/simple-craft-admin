import type { Route } from './+types/index';
import {
  deletePath,
  extractArchive,
  getPath,
  renamePath,
  saveFile,
  uploadFiles,
} from '~/server/file-explorer';
import {
  ArchiveViewer,
  DirectoryExplorer,
  FileEditor,
  saveSchema,
} from '~/components/file-explorer';
import { z } from 'zod';
import {
  deleteSchema,
  extractSchema,
  renameSchema,
  uploadSchema,
} from '~/components/file-explorer/modals';
import { parseFormData, validationError } from '@rvf/react-router';

const schema = z.discriminatedUnion('type', [
  deleteSchema,
  uploadSchema,
  extractSchema,
  renameSchema,
  saveSchema,
]);

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

  switch (result.data.type) {
    case 'delete':
      await deletePath(params.uid, result.data.path);
      break;
    case 'upload':
      await uploadFiles(params.uid, result.data.path, result.data.file);
      break;
    case 'extract':
      await extractArchive(params.uid, result.data.path, result.data.destinationDir);
      break;
    case 'rename':
      await renamePath(params.uid, result.data.path, result.data.newName);
      break;
    case 'save':
      await saveFile(params.uid, result.data.path, result.data.content);
      break;
  }
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
