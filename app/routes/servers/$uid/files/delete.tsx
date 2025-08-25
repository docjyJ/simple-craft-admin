import { Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { data, Link, redirect } from 'react-router';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { z } from 'zod';
import { getPathFromUrl, getStat, resolveSafePath } from '~/utils.server/path-validation';
import { cleanPath, encodePathParam, parentPath } from '~/utils/path-utils';
import { rm } from 'node:fs/promises';
import type { Route } from './+types/delete';

const schema = z.object({
  path: z.string(),
});

export async function loader({ request, params: { uid } }: Route.LoaderArgs) {
  const path = getPathFromUrl(request.url);
  if (path === '/') {
    throw data('Forbidden: cannot delete root', { status: 403 });
  }
  const fullPath = resolveSafePath(uid, path);
  const stats = await getStat(fullPath);
  const parent = parentPath(path);
  const fileName = path.split('/').pop() || 'Unknown';
  return { isFolder: stats.isDirectory(), parent, fileName };
}

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  const result = await parseFormData(request, schema);
  if (result.error) return validationError(result.error, result.submittedData);
  const path = cleanPath(result.data.path);
  if (path === '/') {
    throw data('Forbidden: cannot delete root', { status: 403 });
  }
  const fullPath = resolveSafePath(uid, path);
  await rm(fullPath, { recursive: true, force: false }).catch((e) => {
    if (e?.code === 'ENOENT') throw data('Not Found', { status: 404 });
    throw e;
  });
  return redirect(`/servers/${uid}/files?path=${encodePathParam(parentPath(path))}`);
}

export default function DeleteFileRoute({
  loaderData: { isFolder, parent, fileName },
  params: { uid },
}: Route.ComponentProps) {
  return (
    <Paper withBorder maw={500}>
      <Stack gap="lg" m="md">
        <Title order={3}>Confirm deletion</Title>
        <Text>
          {isFolder
            ? `Are you sure you want to delete the folder '${fileName}' and all of its contents?`
            : `Are you sure you want to delete the file '${fileName}'?`}
        </Text>
        <Text>This action cannot be undone.</Text>
        <ValidatedForm method="post" schema={schema} defaultValues={{ path: parent + '/' + fileName }}>
          {(form) => (
            <>
              <input {...form.getInputProps('path', { type: 'hidden' })} />
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
                <Button color="red" type="submit" loading={form.formState.isSubmitting}>
                  Delete
                </Button>
              </Group>
            </>
          )}
        </ValidatedForm>
      </Stack>
    </Paper>
  );
}
