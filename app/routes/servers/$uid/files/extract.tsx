import { Button, Group, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { Link, redirect } from 'react-router';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { z } from 'zod';
import type { Route } from './+types/extract';
import { getPathFromUrl, requireArchive, resolveSafePath } from '~/utils.server/path-validation';
import { cleanPath, encodePathParam, extractEntryPath } from '~/utils/path-utils';
import { readFile } from 'node:fs/promises';
import { requireAuth } from '~/utils.server/session';
import { extractZipToDir } from '~/utils.server/zip';
import { useTranslation } from 'react-i18next';

const schema = z.object({
  path: z.string().transform(cleanPath),
  destinationDir: z.string().min(1, 'server.files.destinationRequired').transform(cleanPath),
});

export async function loader({ request, params: { uid } }: Route.LoaderArgs) {
  await requireAuth(request);
  const path = getPathFromUrl(request.url);
  return await requireArchive(resolveSafePath(uid, path)).then(() => ({ path }));
}

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  await requireAuth(request);
  const result = await parseFormData(request, schema);
  if (result.error) return validationError(result.error, result.submittedData);
  const fullArchivePath = resolveSafePath(uid, result.data.path);
  await requireArchive(fullArchivePath);
  const destinationFull = resolveSafePath(uid, result.data.destinationDir);
  await extractZipToDir(await readFile(fullArchivePath), destinationFull);
  return redirect(`/servers/${uid}/files?path=${encodePathParam(result.data.destinationDir)}`);
}

export default function ExtractArchiveRoute({ loaderData: { path }, params: { uid } }: Route.ComponentProps) {
  const { entryName, parentPath } = extractEntryPath(path)!;
  const destinationDir = (parentPath === '/' ? '/' : parentPath + '/') + entryName.replace(/\.[^/.]+$/, '');
  const { t } = useTranslation();
  const parseError = (error: string | null) => {
    if (!error) return null;
    if (error === 'server.files.destinationRequired') return t(($) => $.server.files.destinationRequired);
    return error;
  };
  return (
    <Paper withBorder maw={500} m="auto">
      <Stack gap="lg" m="md">
        <Title order={3}>{t(($) => $.server.files.extractTitle)}</Title>
        <Text>{t(($) => $.server.files.extractDescription, { name: entryName })}</Text>
        <ValidatedForm method="post" schema={schema} defaultValues={{ path, destinationDir }}>
          {(form) => (
            <>
              <input {...form.getInputProps('path', { type: 'hidden' })} />
              <TextInput
                label={t(($) => $.server.files.destinationFolder)}
                required
                {...form.getInputProps('destinationDir')}
                error={parseError(form.error('destinationDir'))}
              />
              <Group justify="center" mt="md">
                <Button
                  component={Link}
                  to={`/servers/${uid}/files?path=${encodePathParam(parentPath || '/')}`}
                  variant="subtle"
                  color="gray"
                  type="button"
                >
                  {t(($) => $.server.files.cancel)}
                </Button>
                <Button color="blue" type="submit" loading={form.formState.isSubmitting}>
                  {t(($) => $.server.files.extractAction)}
                </Button>
              </Group>
            </>
          )}
        </ValidatedForm>
      </Stack>
    </Paper>
  );
}
