import JSZip from 'jszip';
import { Button, Group, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { Link, redirect } from 'react-router';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { z } from 'zod';
import type { Route } from './+types/extract';
import { getPathFromUrl, requireArchive, resolveSafePath } from '~/utils.server/path-validation';
import { cleanPath, encodePathParam, extractEntryPath } from '~/utils/path-utils';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { requireAuth } from '~/utils.server/session';

const schema = z.object({
  path: z.string().transform(cleanPath),
  destinationDir: z.string().min(1, 'Destination is required').transform(cleanPath),
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
  const zip = await JSZip.loadAsync(await readFile(fullArchivePath));
  await mkdir(destinationFull, { recursive: true });
  for (const entry of Object.values(zip.files)) {
    const filePath = `${destinationFull}/${entry.name}`;
    if (entry.dir) {
      await mkdir(filePath, { recursive: true });
    } else {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, await entry.async('nodebuffer'));
    }
  }
  return redirect(`/servers/${uid}/files?path=${encodePathParam(result.data.destinationDir)}`);
}

export default function ExtractArchiveRoute({ loaderData: { path }, params: { uid } }: Route.ComponentProps) {
  const { entryName, parentPath } = extractEntryPath(path)!;
  const destinationDir = (parentPath === '/' ? '/' : parentPath + '/') + entryName.replace(/\.[^/.]+$/, '');
  return (
    <Paper withBorder maw={500} m="auto">
      <Stack gap="lg" m="md">
        <Title order={3}>Extract archive</Title>
        <Text>
          You are about to extract the archive '{entryName}'. Its contents will be placed into the destination folder.
        </Text>
        <ValidatedForm method="post" schema={schema} defaultValues={{ path, destinationDir }}>
          {(form) => (
            <>
              <input {...form.getInputProps('path', { type: 'hidden' })} />
              <TextInput
                label="Destination folder"
                required
                {...form.getInputProps('destinationDir')}
                error={form.error('destinationDir')}
              />
              <Group justify="center" mt="md">
                <Button
                  component={Link}
                  to={`/servers/${uid}/files?path=${encodePathParam(parentPath || '/')}`}
                  variant="subtle"
                  color="gray"
                  type="button"
                >
                  Cancel
                </Button>
                <Button color="blue" type="submit" loading={form.formState.isSubmitting}>
                  Extract
                </Button>
              </Group>
            </>
          )}
        </ValidatedForm>
      </Stack>
    </Paper>
  );
}
