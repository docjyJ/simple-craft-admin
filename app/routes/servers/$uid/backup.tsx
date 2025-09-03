import type { Route } from './+types/backup';
import { Button, Group, List, Paper, Stack, Text, Title } from '@mantine/core';
import { requireAuth } from '~/utils.server/session';
import { z } from 'zod';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { isValidUid, resolveSafePath } from '~/utils.server/path-validation';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createZipFromDir, extractZipToDir } from '~/utils.server/zip';
import { resolve } from 'node:path';
import { data } from 'react-router';
import { useTranslation } from 'react-i18next';

const BACKUP_ROOT = resolve('backup');

function getBackupPath(uid: string): string {
  if (!isValidUid(uid)) {
    throw data(`Invalid uid: '${uid}'.`, { status: 400 });
  }
  return `${BACKUP_ROOT}/${uid}`;
}

const schema = z.object({
  intent: z.enum(['backup', 'restore']),
  file: z.string().optional(),
});

export async function loader({ params: { uid }, request }: Route.LoaderArgs) {
  await requireAuth(request);
  const path = getBackupPath(uid);
  await mkdir(path, { recursive: true });
  const files = await readdir(path);
  const backups = files
    .filter((f) => f.endsWith('.zip'))
    .sort()
    .reverse();
  return { backups };
}

export async function action({ params: { uid }, request }: Route.ActionArgs) {
  await requireAuth(request);
  const result = await parseFormData(request, schema);
  if (result.error) return validationError(result.error, result.submittedData);
  const { intent, file } = result.data;
  if (intent === 'backup') {
    const serverDir = resolveSafePath(uid, '/');
    const backupDir = getBackupPath(uid);
    await mkdir(backupDir, { recursive: true });
    const date = new Date().toISOString();
    const backupPath = `${backupDir}/${date}.zip`;

    const content = await createZipFromDir(serverDir);
    await writeFile(backupPath, content);
    return { ok: true };
  }
  if (intent === 'restore') {
    if (!file)
      return validationError(
        { formId: result.formId, fieldErrors: { file: 'server.backup.error.missingFile' } },
        result.data,
      );
    const backupPath = getBackupPath(uid) + '/' + file;
    const serverDir = resolveSafePath(uid, '/');
    await rm(serverDir, { recursive: true, force: true });
    await extractZipToDir(await readFile(backupPath), serverDir);
    return { ok: true };
  }
  return validationError(
    { formId: result.formId, fieldErrors: { intent: 'server.backup.error.invalidRequest' } },
    result.data,
  );
}

export default function BackupPage({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation();
  const parseError = (error: string | null) => {
    if (!error) return null;
    if (error === 'server.backup.error.missingFile') return t(($) => $.server.backup.error.missingFile);
    if (error === 'server.backup.error.invalidRequest') return t(($) => $.server.backup.error.invalidRequest);
    return error;
  };
  return (
    <Stack>
      <Title order={2}>{t(($) => $.server.backup.title)}</Title>
      <Paper withBorder p="md">
        <ValidatedForm method="post" schema={schema} defaultValues={{ intent: 'backup' }}>
          {(form) => (
            <>
              <Button type="submit" name="intent" value="backup">
                {t(($) => $.server.backup.backupNow)}
              </Button>
              {form.error('intent') && <Text c="red">{parseError(form.error('intent'))}</Text>}
            </>
          )}
        </ValidatedForm>
      </Paper>
      <Paper withBorder p="md">
        <Text fw={500} mb="sm">
          {t(($) => $.server.backup.available)}
        </Text>
        <List spacing="xs">
          {loaderData.backups.length === 0 && <Text>{t(($) => $.server.backup.none)}</Text>}
          {loaderData.backups.map((file: string) => (
            <List.Item key={file}>
              <Group>
                <Text>{file}</Text>
                <ValidatedForm
                  method="post"
                  schema={schema}
                  style={{ display: 'inline' }}
                  defaultValues={{ file, intent: 'restore' }}
                >
                  {(form) => (
                    <>
                      <input type="hidden" name="file" value={file} />
                      <Button type="submit" name="intent" value="restore" size="xs" color="orange">
                        {t(($) => $.server.backup.restore)}
                      </Button>
                      {form.error('file') && <Text c="red">{parseError(form.error('file'))}</Text>}
                    </>
                  )}
                </ValidatedForm>
              </Group>
            </List.Item>
          ))}
        </List>
      </Paper>
    </Stack>
  );
}
