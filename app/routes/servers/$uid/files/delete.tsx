import { Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { Link, redirect } from 'react-router';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { z } from 'zod';
import { resolveSafePath } from '~/server/path-validation';
import { cleanPath, encodePathParam, parentPath } from '~/utils/path-utils';
import { rm, stat } from 'node:fs/promises';
import type { Route } from './+types/delete';

const schema = z.object({
  path: z.string(),
});

export async function loader({ request, params: { uid } }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const raw = url.searchParams.get('path') || '/';
  const path = cleanPath(raw);
  if (path === '/') {
    return new Response('Forbidden: cannot delete root', { status: 403 });
  }
  try {
    const fullPath = resolveSafePath(uid, path);
    const s = await stat(fullPath);
    const parent = parentPath(path);
    const fileName = path.split('/').pop() || 'Unknown';
    return { isFolder: s.isDirectory(), parent, fileName };
  } catch (e: any) {
		if (e?.code === 'ENOENT') return new Response('Not Found', { status: 404 });
		throw e
  }
}

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  const result = await parseFormData(request, schema);
  if (result.error) return validationError(result.error, result.submittedData);
  const path = cleanPath(result.data.path);
  if (path === '/') {
    return new Response('Forbidden: cannot delete root', { status: 403 });
  }
  try {
    const fullPath = resolveSafePath(uid, path);
    await rm(fullPath, { recursive: true, force: false });
		return redirect(`/servers/${uid}/files?path=${encodePathParam(parentPath(path))}`);
  } catch (e: any) {
    if (e?.code === 'ENOENT') return new Response('Not Found', { status: 404 });
		throw e;
  }
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
        <ValidatedForm
          method="post"
          schema={schema}
          defaultValues={{ path: parent + '/' + fileName }}
        >
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
