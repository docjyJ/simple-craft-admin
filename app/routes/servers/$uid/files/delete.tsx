import { rm, stat } from 'node:fs/promises';
import { Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { useTranslation } from 'react-i18next';
import { Link, redirect } from 'react-router';
import { z } from 'zod';
import { cleanPath, encodePathParam, extractEntryPath } from '~/utils/path-utils';
import { getPathFromUrl, requireNonRoot, resolveSafePath, throw404IfNotExist } from '~/utils.server/path-validation';
import { requireAuth } from '~/utils.server/session';
import type { Route } from './+types/delete';

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
    redirect(`/servers/${uid}/files?path=${encodePathParam(extractEntryPath(result.data.path)?.parentPath ?? '/')}`),
  );
}

export default function DeleteFileRoute({ loaderData: { isFolder, path }, params: { uid } }: Route.ComponentProps) {
  const { entryName, parentPath } = extractEntryPath(path) ?? { entryName: '', parentPath: '/' };
  const { t } = useTranslation();
  return (
    <Paper withBorder maw={500} m="auto">
      <Stack gap="lg" m="md">
        <Title order={3}>{t(($) => $.server.files.deleteConfirmTitle)}</Title>
        <Text>
          {isFolder
            ? t(($) => $.server.files.deleteConfirmFolder, { name: entryName })
            : t(($) => $.server.files.deleteConfirmFile, { name: entryName })}
        </Text>
        <Text>{t(($) => $.server.files.deleteIrreversible)}</Text>
        <ValidatedForm method="post" schema={schema} defaultValues={{ path: `${parentPath}/${entryName}` }}>
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
                  {t(($) => $.server.files.cancel)}
                </Button>
                <Button color="red" type="submit" loading={form.formState.isSubmitting}>
                  {t(($) => $.server.files.delete)}
                </Button>
              </Group>
            </>
          )}
        </ValidatedForm>
      </Stack>
    </Paper>
  );
}
