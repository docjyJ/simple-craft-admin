import JSZip from 'jszip';
import { Button, Group, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { data, Link, redirect } from 'react-router';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { z } from 'zod';
import type { Route } from './+types/extract';
import { getPathFromUrl, getStat, resolveSafePath } from '~/utils.server/path-validation';
import { cleanPath, encodePathParam, isArchive, parentPath } from '~/utils/path-utils';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const schema = z.object({
  path: z.string(),
  destinationDir: z.string().min(1, 'Destination is required'),
});

export async function loader({ request, params: { uid } }: Route.LoaderArgs) {
  const path = getPathFromUrl(request.url);
  const fullPath = resolveSafePath(uid, path);
  const stats = await getStat(fullPath);
  if (!stats.isFile() || !isArchive(fullPath)) {
    throw data('Bad Request: not an archive', { status: 400 });
  }
  const parent = parentPath(path);
  const fileName = path.split('/').pop() || 'archive.zip';
  const baseName = fileName.endsWith('.zip') ? fileName.slice(0, -4) : fileName;
  const defaultDestination = `${parent}/${baseName}`;
  return { parent, fileName, path, defaultDestination };
}

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  const result = await parseFormData(request, schema);
  if (result.error) return validationError(result.error, result.submittedData);
  const archivePath = cleanPath(result.data.path);
  const destinationDir = cleanPath(result.data.destinationDir);
  const fullArchivePath = resolveSafePath(uid, archivePath);
  const stats = await getStat(fullArchivePath);
  if (!stats.isFile() || !isArchive(fullArchivePath)) {
    throw data('Bad Request: not an archive', { status: 400 });
  }
  const buffer = await readFile(fullArchivePath);
  const destinationFull = resolveSafePath(uid, destinationDir);
  await mkdir(destinationFull, { recursive: true });

  const zip = await JSZip.loadAsync(buffer);
  for (const entry of Object.values(zip.files)) {
    const filePath = `${destinationFull}/${entry.name}`;
    if (entry.dir) {
      await mkdir(filePath, { recursive: true });
    } else {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, await entry.async('nodebuffer'));
    }
  }
  return redirect(`/servers/${uid}/files?path=${encodePathParam(destinationDir)}`);
}

export default function ExtractArchiveRoute({
  loaderData: { parent, fileName, path, defaultDestination },
  params: { uid },
}: Route.ComponentProps) {
  return (
    <Paper withBorder maw={500}>
      <Stack gap="lg" m="md">
        <Title order={3}>Extract archive</Title>
        <Text>
          You are about to extract the archive '{fileName}'. Its contents will be placed into the destination folder.
        </Text>
        <ValidatedForm method="post" schema={schema} defaultValues={{ path, destinationDir: defaultDestination }}>
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
                  to={`/servers/${uid}/files?path=${encodePathParam(parent || '/')}`}
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
