import { Button, FileInput, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { Form, Link, redirect } from 'react-router';
import { parseFormData, validationError } from '@rvf/react-router';
import { z } from 'zod';
import type { Route } from './+types/upload';
import { getPathFromUrl, requireDirectory, resolveSafePath } from '~/utils.server/path-validation';
import { cleanPath, encodePathParam, extractEntryPath } from '~/utils/path-utils';
import { writeFile } from 'node:fs/promises';
import { requireAuth } from '~/utils.server/session';
import { useTranslation } from 'react-i18next';

const schema = z.object({
  path: z.string().transform(cleanPath),
  file: z.file(),
});

export async function loader({ request, params: { uid } }: Route.LoaderArgs) {
  await requireAuth(request);
  const path = getPathFromUrl(request.url);
  return requireDirectory(resolveSafePath(uid, path)).then(() => ({ path }));
}

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  await requireAuth(request);
  const result = await parseFormData(request, schema);
  if (result.error) return validationError(result.error, result.submittedData);
  const dirFull = resolveSafePath(uid, result.data.path);
  await requireDirectory(dirFull);
  await writeFile(`${dirFull}/${result.data.file.name}`, Buffer.from(await result.data.file.arrayBuffer()));
  return redirect(`/servers/${uid}/files?path=${encodePathParam(result.data.path)}`);
}

export default function UploadFileRoute({ loaderData: { path }, params: { uid } }: Route.ComponentProps) {
  const folderName = extractEntryPath(path)?.entryName;
  const { t } = useTranslation();
  return (
    <Paper withBorder maw={500} m="auto">
      <Stack gap="lg" m="md">
        <Title order={3}>{t(($) => $.server.files.uploadTitle)}</Title>
        <Text>
          {folderName
            ? t(($) => $.server.files.uploadingInto, { name: folderName })
            : t(($) => $.server.files.uploadingIntoRoot)}
        </Text>
        <Form method="post" encType="multipart/form-data">
          <input type="hidden" name="path" value={path} />
          <FileInput
            name="file"
            required
            label={t(($) => $.server.files.fileLabel)}
            placeholder={t(($) => $.server.files.filePlaceholder)}
            accept="*/*"
          />
          <Group justify="center" mt="md">
            <Button
              component={Link}
              to={`/servers/${uid}/files?path=${encodePathParam(path)}`}
              variant="subtle"
              color="gray"
              type="button"
            >
              {t(($) => $.server.files.cancel)}
            </Button>
            <Button color="blue" type="submit">
              {t(($) => $.server.files.uploadAction)}
            </Button>
          </Group>
        </Form>
      </Stack>
    </Paper>
  );
}
