import { Button, FileInput, Group, Paper, Stack, Title } from '@mantine/core';
import { data, Form, Link, redirect } from 'react-router';
import { parseFormData, validationError } from '@rvf/react-router';
import { z } from 'zod';
import type { Route } from './+types/upload';
import { getPathFromUrl, getStat, resolveSafePath } from '~/server/path-validation';
import { cleanPath, encodePathParam } from '~/utils/path-utils';
import { writeFile } from 'node:fs/promises';

const schema = z.object({
  path: z.string(),
  file: z.file(),
});

export async function loader({ request, params: { uid } }: Route.LoaderArgs) {
  const path = getPathFromUrl(request.url);
  const fullPath = resolveSafePath(uid, path);
  const stats = await getStat(fullPath);
  if (!stats.isDirectory()) {
    throw data('Bad Request: not a directory', { status: 400 });
  }
  const folderName = path === '/' ? 'Root' : path.split('/').pop() || 'Folder';
  return { path, folderName };
}

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  const result = await parseFormData(request, schema);
  if (result.error) return validationError(result.error, result.submittedData);
  const dirPath = cleanPath(result.data.path);
  const dirFull = resolveSafePath(uid, dirPath);
  const stats = await getStat(dirFull);
  if (!stats.isDirectory()) {
    throw data('Bad Request: not a directory', { status: 400 });
  }
  await writeFile(`${dirFull}/${result.data.file.name}`, Buffer.from(await result.data.file.arrayBuffer()));
  return redirect(`/servers/${uid}/files?path=${encodePathParam(dirPath)}`);
}

export default function UploadFileRoute({ loaderData: { path, folderName }, params: { uid } }: Route.ComponentProps) {
  return (
    <Paper withBorder maw={500}>
      <Stack gap="lg" m="md">
        <Title order={3}>Upload file</Title>
        <div>Choose a file to upload into '{folderName}'.</div>
        <Form method="post" encType="multipart/form-data">
          <input type="hidden" name="path" value={path} />
          <FileInput name="file" required label="File" placeholder="Select file" accept="*/*" />
          <Group justify="center" mt="md">
            <Button
              component={Link}
              to={`/servers/${uid}/files?path=${encodePathParam(path)}`}
              variant="subtle"
              color="gray"
              type="button"
            >
              Cancel
            </Button>
            <Button color="blue" type="submit">
              Upload
            </Button>
          </Group>
        </Form>
      </Stack>
    </Paper>
  );
}
