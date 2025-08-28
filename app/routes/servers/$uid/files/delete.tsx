import { Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { Link, redirect } from 'react-router';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { z } from 'zod';
import { getPathFromUrl, requireNonRoot, resolveSafePath, throw404IfNotExist } from '~/utils.server/path-validation';
import { cleanPath, encodePathParam, extractEntryPath } from '~/utils/path-utils';
import { rm, stat } from 'node:fs/promises';
import type { Route } from './+types/delete';
import { requireAuth } from '~/utils.server/session';

const schema = z.object({
  path: z.string().transform(cleanPath),
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
  return throw404IfNotExist(rm(resolveSafePath(uid, result.data.path), { recursive: true, force: false })).then(() =>
    redirect(`/servers/${uid}/files?path=${encodePathParam(extractEntryPath(result.data.path)!.parentPath)}`),
  );
}

export default function DeleteFileRoute({ loaderData: { isFolder, path }, params: { uid } }: Route.ComponentProps) {
  const { entryName, parentPath } = extractEntryPath(path)!;
  return (
    <Paper withBorder maw={500} m="auto">
      <Stack gap="lg" m="md">
        <Title order={3}>Confirm deletion</Title>
        <Text>
          {isFolder
            ? `Are you sure you want to delete the folder '${entryName}' and all of its contents?`
            : `Are you sure you want to delete the file '${entryName}'?`}
        </Text>
        <Text>This action cannot be undone.</Text>
        <ValidatedForm method="post" schema={schema} defaultValues={{ path: parentPath + '/' + entryName }}>
          {(form) => (
            <>
              <input {...form.getInputProps('path', { type: 'hidden' })} />
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
