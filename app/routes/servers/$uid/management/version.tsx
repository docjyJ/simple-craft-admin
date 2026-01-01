import { writeFile } from 'node:fs/promises';
import { Button, Group, Paper, ScrollArea, Stack, Tabs, Title } from '@mantine/core';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { IconRefresh } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { prisma } from '~/utils.server/global';
import { listCachedMinecraftVersions, refreshMinecraftVersionCache } from '~/utils.server/minecraft-versions';
import { resolveSafePath } from '~/utils.server/path-validation';
import { getOrCreateServer } from '~/utils.server/server-minecraft';
import { requireAuth } from '~/utils.server/session';
import type { Route } from './+types/version';

export async function loader({ params: { uid }, request }: Route.LoaderArgs) {
  await requireAuth(request, { admin: true });
  const instance = getOrCreateServer(uid);
  const serverData = await instance.getServerData();
  const releases = await listCachedMinecraftVersions('release');
  const snapshots = await listCachedMinecraftVersions('snapshot');
  return { serverData, releases, snapshots };
}

const selectSchema = z.object({
  intent: z.literal('select'),
  versionName: z.string().min(1, 'server.management.errors.missingVersionName'),
  versionType: z.enum(['release', 'snapshot']),
});

const refreshSchema = z.object({
  intent: z.literal('refresh'),
});

const versionActionSchema = z.discriminatedUnion('intent', [refreshSchema, selectSchema]);

export async function action({ params: { uid }, request }: Route.ActionArgs) {
  await requireAuth(request, { admin: true });
  const result = await parseFormData(request, versionActionSchema);
  if (result.error) return validationError(result.error, result.submittedData);
  const data = result.data;

  if (data.intent === 'refresh') {
    try {
      await refreshMinecraftVersionCache();
      return null;
    } catch (_e) {
      return validationError(
        {
          formId: result.formId,
          fieldErrors: { intent: 'server.management.errors.refreshFailed' },
        },
        result.submittedData,
      );
    }
  }

  if (data.intent === 'select') {
    const { versionName, versionType } = data;
    try {
      const version = await prisma.verssionCache.findUnique({
        where: { name_type: { name: versionName, type: versionType } },
      });
      if (!version) {
        return validationError(
          { formId: result.formId, fieldErrors: { versionName: 'server.management.errors.versionNotFound' } },
          result.submittedData,
        );
      }
      const jarRes = await fetch(version.jarUrl).catch(() => null);
      if (!jarRes || !jarRes.ok) {
        return validationError(
          { formId: result.formId, fieldErrors: { versionName: 'server.management.errors.downloadFailed' } },
          result.submittedData,
        );
      }
      const buf = Buffer.from(await jarRes.arrayBuffer());
      await writeFile(resolveSafePath(uid, 'server.jar'), buf);
      return null;
    } catch (_e) {
      return validationError(
        { formId: result.formId, fieldErrors: { versionName: 'server.management.errors.selectError' } },
        result.submittedData,
      );
    }
  }

  return validationError(
    { formId: result.formId, fieldErrors: { intent: 'server.management.errors.unknownIntent' } },
    result.submittedData,
  );
}

function VersionList({ items, type }: { items: { name: string; jarUrl: string }[]; type: 'release' | 'snapshot' }) {
  const { t } = useTranslation();
  return (
    <ScrollArea h={400} type="auto" offsetScrollbars>
      <Stack gap="xs">
        {items.map((v) => (
          <ValidatedForm
            key={type + v.name}
            method="post"
            schema={selectSchema}
            defaultValues={{ intent: 'select', versionName: v.name, versionType: type }}
            style={{ display: 'flex' }}
          >
            {(form) => {
              const status = form.formState.submitStatus;
              const color = status === 'error' ? 'red' : status === 'success' ? 'green' : undefined;
              const errorName = form.error('versionName');
              return (
                <>
                  <input type="hidden" {...form.getInputProps('intent')} />
                  <input type="hidden" {...form.getInputProps('versionName')} />
                  <input type="hidden" {...form.getInputProps('versionType')} />
                  <Button
                    variant="light"
                    type="submit"
                    fullWidth
                    loading={form.formState.isSubmitting}
                    {...(color ? { color } : {})}
                  >
                    {v.name}
                  </Button>
                  {status === 'error' && errorName && (
                    <div style={{ color: 'var(--mantine-color-red-6)', fontSize: 12 }}>
                      {t(($) => $.server.management.errors.missingVersionName)}
                    </div>
                  )}
                </>
              );
            }}
          </ValidatedForm>
        ))}
        {items.length === 0 && <div style={{ opacity: 0.6 }}>{t(($) => $.server.management.noVersions)}</div>}
      </Stack>
    </ScrollArea>
  );
}

export default function ManagementVersion({ loaderData: { releases, snapshots } }: Route.ComponentProps) {
  const { t } = useTranslation();
  return (
    <Paper withBorder p="md">
      <Stack>
        <Title order={3}>{t(($) => $.server.management.versionManagement)}</Title>
        <Group>
          <ValidatedForm method="post" schema={refreshSchema} defaultValues={{ intent: 'refresh' }}>
            {(form) => {
              const status = form.formState.submitStatus;
              const color = status === 'error' ? 'red' : status === 'success' ? 'green' : undefined;
              return (
                <>
                  <input type="hidden" {...form.getInputProps('intent')} />
                  <Button
                    leftSection={<IconRefresh size={16} />}
                    type="submit"
                    loading={form.formState.isSubmitting}
                    disabled={form.formState.isSubmitting}
                    variant="outline"
                    {...(color ? { color } : {})}
                  >
                    {t(($) => $.server.management.refreshList)}
                  </Button>
                </>
              );
            }}
          </ValidatedForm>
        </Group>
        <Tabs defaultValue="release">
          <Tabs.List>
            <Tabs.Tab value="release">{t(($) => $.server.management.releases, { count: releases.length })}</Tabs.Tab>
            <Tabs.Tab value="snapshot">{t(($) => $.server.management.snapshots, { count: snapshots.length })}</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="release" pt="sm">
            <VersionList items={releases} type="release" />
          </Tabs.Panel>
          <Tabs.Panel value="snapshot" pt="sm">
            <VersionList items={snapshots} type="snapshot" />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Paper>
  );
}
