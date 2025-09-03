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
import { useTranslation } from 'react-i18next';

const schema = z.object({
  path: z.string().transform(cleanPath),
  newPath: z.string().min(1, 'server.files.newNameRequired').transform(cleanPath),
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
        fieldErrors: { newPath: 'server.files.newNameDifferent' },
      },
      result.submittedData,
    );
  }
  if (outOfRoot(result.data.newPath)) {
    return validationError(
      {
        formId: result.formId,
        fieldErrors: { newPath: 'server.files.pathOutside' },
      },
      result.submittedData,
    );
  }
  if (await pathExist(destPath)) {
    return validationError(
      {
        formId: result.formId,
        fieldErrors: { newPath: 'server.files.nameExists' },
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
  const { t } = useTranslation();
  const parseError = (error: string | null) => {
    if (!error) return null;
    if (error === 'server.files.newNameRequired') return t(($) => $.server.files.newNameRequired);
    if (error === 'server.files.newNameDifferent') return t(($) => $.server.files.newNameDifferent);
    if (error === 'server.files.pathOutside') return t(($) => $.server.files.pathOutside);
    if (error === 'server.files.nameExists') return t(($) => $.server.files.nameExists);
    return error;
  };
  return (
    <Paper withBorder maw={500} m="auto">
      <Stack gap="lg" m="md">
        <Title order={3}>
          {isFolder ? t(($) => $.server.files.renameTitleFolder) : t(($) => $.server.files.renameTitleFile)}
        </Title>
        <Text>
          {isFolder
            ? t(($) => $.server.files.renamePromptFolder, { name: entryName })
            : t(($) => $.server.files.renamePromptFile, { name: entryName })}
        </Text>
        <ValidatedForm method="post" schema={schema} defaultValues={{ path, newPath: path }}>
          {(form) => (
            <>
              <input {...form.getInputProps('path', { type: 'hidden' })} />
              <TextInput
                label={t(($) => $.server.files.newNameLabel)}
                required
                {...form.getInputProps('newPath')}
                error={parseError(form.error('newPath'))}
              />
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
                <Button color="blue" type="submit" loading={form.formState.isSubmitting}>
                  {t(($) => $.server.files.rename)}
                </Button>
              </Group>
            </>
          )}
        </ValidatedForm>
      </Stack>
    </Paper>
  );
}
