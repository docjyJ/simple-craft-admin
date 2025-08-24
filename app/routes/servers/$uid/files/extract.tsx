import JSZip from 'jszip';
import { Button, Group, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { Link, redirect } from 'react-router';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { z } from 'zod';
import type { Route } from './+types/extract';
import { resolveSafePath } from '~/server/path-validation';
import { cleanPath, encodePathParam, parentPath } from '~/utils/path-utils';
import { stat, readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const schema = z.object({
  path: z.string(),
  destinationDir: z.string().min(1, 'Destination is required'),
});

export async function loader({ request, params: { uid } }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const raw = url.searchParams.get('path') || '/';
  const path = cleanPath(raw);
  if (path === '/') return redirect(`/servers/${uid}/files?path=/`);
  try {
    const fullPath = resolveSafePath(uid, path);
    const s = await stat(fullPath);
    if (!s.isFile() || !fullPath.endsWith('.zip')) {
      return redirect(`/servers/${uid}/files?path=${encodePathParam(parentPath(path))}`);
    }
    const parent = parentPath(path);
    const fileName = path.split('/').pop() || 'archive.zip';
    const baseName = fileName.endsWith('.zip') ? fileName.slice(0, -4) : fileName;
    const defaultDestination = `${parent}/${baseName}`;
    return { parent, fileName, path, defaultDestination };
  } catch (e) {
    console.warn(e);
    return redirect(`/servers/${uid}/files?path=${encodePathParam(parentPath(path))}`);
  }
}

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  const result = await parseFormData(request, schema);
  if (result.error) return validationError(result.error, result.submittedData);
  const archivePath = cleanPath(result.data.path);
  const destinationDir = cleanPath(result.data.destinationDir);
  if (archivePath === '/' || !archivePath.endsWith('.zip')) {
    return validationError(
      {
        formId: result.formId,
        fieldErrors: { path: 'Invalid archive path' },
      },
      result.submittedData,
    );
  }
  try {
    const fullArchivePath = resolveSafePath(uid, archivePath);
    const s = await stat(fullArchivePath);
    if (!s.isFile()) {
      return validationError(
        { formId: result.formId, fieldErrors: { path: 'Archive not found' } },
        result.submittedData,
      );
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
  } catch (e) {
    console.warn(e);
    return validationError(
      { formId: result.formId, fieldErrors: { destinationDir: 'Extraction failed' } },
      result.submittedData,
    );
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
          You are about to extract the archive '{fileName}'. Its contents will be placed into the
          destination folder.
        </Text>
        <ValidatedForm
          method="post"
          schema={schema}
          defaultValues={{ path, destinationDir: defaultDestination }}
        >
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
