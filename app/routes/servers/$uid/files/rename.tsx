import { Button, Group, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { data, Link, redirect } from 'react-router';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { getPathFromUrl, getStat, resolveSafePath } from '~/server/path-validation';
import { cleanPath, encodePathParam, parentPath } from '~/utils/path-utils';
import { rename as fsRename } from 'node:fs/promises';
import { z } from 'zod';
import type { Route } from './+types/rename';

const schema = z.object({
  path: z.string(),
  newName: z.string().min(1, 'Name is required'),
});

export async function loader({ request, params: { uid } }: Route.LoaderArgs) {
  const path = getPathFromUrl(request.url);
  if (path === '/') {
    throw data('Forbidden: cannot rename root', { status: 403 });
  }
  const fullPath = resolveSafePath(uid, path);
  const stats = await getStat(fullPath);
  const parent = parentPath(path);
  const fileName = path.split('/').pop() || 'Unknown';
  return { isFolder: stats.isDirectory(), parent, fileName, path };
}

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  const result = await parseFormData(request, schema);
  if (result.error) return validationError(result.error, result.submittedData);
  const sourcePath = cleanPath(result.data.path);
  if (sourcePath === '/') {
    throw data('Forbidden: cannot rename root', { status: 403 });
  }
  const parent = parentPath(sourcePath);
  const currentName = sourcePath.split('/').pop();
  const newName = result.data.newName;
  if (currentName && currentName !== newName) {
    if (newName.includes('/') || newName.includes('..')) {
      return validationError(
        {
          formId: result.formId,
          fieldErrors: { newName: 'Invalid name' },
        },
        result.submittedData,
      );
    }
    try {
      const srcFull = resolveSafePath(uid, sourcePath);
      const parts = srcFull.split('/');
      parts.pop();
      const destFull = `${parts.join('/')}/${newName}`;
      await fsRename(srcFull, destFull);
    } catch (e: any) {
      if (e?.code === 'ENOENT') throw new Response('Not Found', { status: 404 });
      throw e;
    }
  }
  return redirect(`/servers/${uid}/files?path=${encodePathParam(parent === '' ? '/' : parent)}`);
}

export default function RenameFileRoute({
  loaderData: { isFolder, parent, fileName, path },
  params: { uid },
}: Route.ComponentProps) {
  return (
    <Paper withBorder maw={500}>
      <Stack gap="lg" m="md">
        <Title order={3}>Rename {isFolder ? 'folder' : 'file'}</Title>
        <Text>
          {isFolder ? `Enter a new name for the folder '${fileName}'.` : `Enter a new name for the file '${fileName}'.`}
        </Text>
        <ValidatedForm method="post" schema={schema} defaultValues={{ path, newName: fileName }}>
          {(form) => (
            <>
              <input {...form.getInputProps('path', { type: 'hidden' })} />
              <TextInput label="New name" required {...form.getInputProps('newName')} error={form.error('newName')} />
              <Group justify="center" mt="md">
                <Button
                  component={Link}
                  to={`/servers/${uid}/files?path=${encodePathParam(parent)}`}
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
