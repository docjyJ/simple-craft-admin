import { Button, Group, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { Link, redirect } from 'react-router';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import {
  getPathFromUrl,
  outOfRoot,
  pathExist,
  requireNonRoot,
  resolveSafePath,
  throw404IfNotExist,
} from '~/utils.server/path-validation';
import { cleanPath, encodePathParam, extractEntryPath } from '~/utils/path-utils';
import { rename as fsRename, stat } from 'node:fs/promises';
import { z } from 'zod';
import type { Route } from './+types/rename';
import { requireAuth } from '~/utils.server/session';

const schema = z.object({
  path: z.string().transform(cleanPath),
  newPath: z.string().min(1, 'New is required').transform(cleanPath),
});

export async function loader({ request, params: { uid } }: Route.LoaderArgs) {
  await requireAuth(request);
  const path = getPathFromUrl(request.url);
  requireNonRoot(path);
  return throw404IfNotExist(stat(resolveSafePath(uid, path))).then((stats) => ({
    isFolder: stats.isDirectory(),
    path,
  }));
}

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  await requireAuth(request);
  const result = await parseFormData(request, schema);
  if (result.error) return validationError(result.error, result.submittedData);
  requireNonRoot(result.data.path);
  const sourcePath = resolveSafePath(uid, result.data.path);
  const destPath = resolveSafePath(uid, result.data.newPath);
  const isFolder = await throw404IfNotExist(stat(sourcePath)).then((s) => s.isDirectory());
  if (sourcePath === destPath) {
    return validationError(
      {
        formId: result.formId,
        fieldErrors: { newPath: 'The new name must be different from the current name' },
      },
      result.submittedData,
    );
  }
  if (outOfRoot(result.data.newPath)) {
    return validationError(
      {
        formId: result.formId,
        fieldErrors: { newName: 'Path is outside the root directory' },
      },
      result.submittedData,
    );
  }
  if (await pathExist(destPath)) {
    return validationError(
      {
        formId: result.formId,
        fieldErrors: { newName: 'A file or folder with that name already exists' },
      },
      result.submittedData,
    );
  }
  await fsRename(sourcePath, destPath);
  return redirect(
    `/servers/${uid}/files?path=${encodePathParam(isFolder ? result.data.newPath : extractEntryPath(result.data.newPath)!.parentPath)}`,
  );
}

export default function RenameFileRoute({ loaderData: { isFolder, path }, params: { uid } }: Route.ComponentProps) {
  const { entryName, parentPath } = extractEntryPath(path)!;
  return (
    <Paper withBorder maw={500} m="auto">
      <Stack gap="lg" m="md">
        <Title order={3}>Rename {isFolder ? 'folder' : 'file'}</Title>
        <Text>
          {isFolder
            ? `Enter a new name for the folder '${entryName}'.`
            : `Enter a new name for the file '${entryName}'.`}
        </Text>
        <ValidatedForm method="post" schema={schema} defaultValues={{ path, newPath: path }}>
          {(form) => (
            <>
              <input {...form.getInputProps('path', { type: 'hidden' })} />
              <TextInput label="New name" required {...form.getInputProps('newPath')} error={form.error('newPath')} />
              <Group justify="center" mt="md">
                <Button
                  component={Link}
                  to={`/servers/${uid}/files?path=${encodePathParam(parentPath)}`}
                  variant="subtle"
                  color="gray"
                  type="button"
                >
                  Cancel
                </Button>
                <Button color="blue" type="submit" loading={form.formState.isSubmitting}>
                  Rename
                </Button>
              </Group>
            </>
          )}
        </ValidatedForm>
      </Stack>
    </Paper>
  );
}
