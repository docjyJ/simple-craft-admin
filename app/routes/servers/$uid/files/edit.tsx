import { Button, Paper, Stack } from '@mantine/core';
import { Link, redirect, Form } from 'react-router';
import { parseFormData, validationError } from '@rvf/react-router';
import { z } from 'zod';
import type { Route } from './+types/edit';
import { resolveSafePath } from '~/server/path-validation';
import { cleanPath, encodePathParam, parentPath } from '~/utils/path-utils';
import { readFile, writeFile, stat } from 'node:fs/promises';
import CodeMirror from '@uiw/react-codemirror';
import { loadLanguage } from '@uiw/codemirror-extensions-langs';
import { useState } from 'react';
import { IconDeviceFloppy } from '@tabler/icons-react';

const saveSchema = z.object({
  path: z.string(),
  content: z.string(),
});

export async function loader({ request, params: { uid } }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const raw = url.searchParams.get('path') || '/';
  const path = cleanPath(raw);
  try {
    const fullPath = resolveSafePath(uid, path);
    const s = await stat(fullPath);
    if (!s.isFile()) {
      return redirect(`/servers/${uid}/files?path=${encodePathParam(path)}`);
    }
    const content = await readFile(fullPath, 'utf-8');
    return { path, content };
  } catch (e) {
    console.warn(e);
    return redirect(`/servers/${uid}/files?path=/`);
  }
}

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  const result = await parseFormData(request, saveSchema);
  if (result.error) return validationError(result.error, result.submittedData);
  const path = cleanPath(result.data.path);
  try {
    const fullPath = resolveSafePath(uid, path);
    await writeFile(fullPath, result.data.content, 'utf-8');
  } catch (e) {
    console.warn(e);
  }
  return redirect(`/servers/${uid}/files?path=${encodePathParam(parentPath(path) || '/')}`);
}

export default function EditFileRoute({ loaderData: { content, path }, params: { uid } }: Route.ComponentProps) {
  const ext = path.split('.').pop();
  const lang = ext ? loadLanguage(ext) : null;
  const [value, setValue] = useState(content);
  const parent = parentPath(path) || '/';
  return (
    <Paper withBorder>
      <Stack m="md" gap="md">
        <Form method="post" action={`?path=${encodePathParam(path)}`}>
          <input type="hidden" name="path" value={path} />
          <input type="hidden" name="content" value={value} />
          <Stack gap="sm">
            <CodeMirror value={value} extensions={lang ? [lang] : undefined} onChange={setValue} />
            <Stack gap="xs" style={{ flexDirection: 'row' }}>
              <Button
                component={Link}
                to={`/servers/${uid}/files?path=${encodePathParam(parent)}`}
                variant="subtle"
                color="gray"
                type="button"
              >
                Cancel
              </Button>
              <Button color="green" type="submit" leftSection={<IconDeviceFloppy />}>Save</Button>
            </Stack>
          </Stack>
        </Form>
      </Stack>
    </Paper>
  );
}
