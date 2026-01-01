import { readFile, writeFile } from 'node:fs/promises';
import { Button, Paper, Stack } from '@mantine/core';
import { parseFormData, validationError } from '@rvf/react-router';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { loadLanguage } from '@uiw/codemirror-extensions-langs';
import CodeMirror from '@uiw/react-codemirror';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Link, redirect } from 'react-router';
import { z } from 'zod';
import { cleanPath, encodePathParam, extractEntryPath } from '~/utils/path-utils';
import { getPathFromUrl, requireTextFile, resolveSafePath } from '~/utils.server/path-validation';
import { requireAuth } from '~/utils.server/session';
import type { Route } from './+types/edit';

const saveSchema = z.object({
  path: z.string().transform(cleanPath),
  content: z.string(),
});

export async function loader({ request, params: { uid } }: Route.LoaderArgs) {
  await requireAuth(request);
  const path = getPathFromUrl(request.url);
  const fullPath = resolveSafePath(uid, path);
  await requireTextFile(fullPath);
  const content = await readFile(fullPath, 'utf-8');
  return { path, content };
}

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  await requireAuth(request);
  const result = await parseFormData(request, saveSchema);
  if (result.error) return validationError(result.error, result.submittedData);
  const fullPath = resolveSafePath(uid, result.data.path);
  await requireTextFile(fullPath);
  await writeFile(fullPath, result.data.content, 'utf-8');
  return redirect(
    `/servers/${uid}/files?path=${encodePathParam(extractEntryPath(result.data.path)?.parentPath ?? '/')}`,
  );
}

export default function EditFileRoute({ loaderData: { content, path }, params: { uid } }: Route.ComponentProps) {
  const ext = path.split('.').pop();
  const lang = ext ? loadLanguage(ext) : null;
  const [value, setValue] = useState(content);
  const { parentPath } = extractEntryPath(path) || { parentPath: '/' };
  const { t } = useTranslation();
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
                to={`/servers/${uid}/files?path=${encodePathParam(parentPath)}`}
                variant="subtle"
                color="gray"
                type="button"
              >
                {t(($) => $.server.files.editCancel)}
              </Button>
              <Button color="green" type="submit" leftSection={<IconDeviceFloppy />}>
                {t(($) => $.server.files.editSave)}
              </Button>
            </Stack>
          </Stack>
        </Form>
      </Stack>
    </Paper>
  );
}
