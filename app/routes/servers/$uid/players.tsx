import type { Route } from './+types/players';
import {
  banIp,
  banPlayer,
  listBannedIps,
  listBannedPlayers,
  listOps,
  listWhitelist,
  opAdd,
  opRemove,
  pardonIp,
  pardonPlayer,
  whitelistAdd,
  whitelistRemove,
} from '~/utils.server/minecraft-players';
import { requireAuth } from '~/utils.server/session';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { z } from 'zod';
import { Button, Divider, Group, Paper, SimpleGrid, Stack, Text, TextInput, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

const valueSchema = z.object({
  intent: z.enum(['whitelist_add', 'whitelist_remove', 'op_add', 'op_remove', 'ban_player', 'pardon_player']),
  value: z.string().trim().min(1, 'server.playersPage.errors.missingValue'),
  reason: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

const ipSchema = z.object({
  intent: z.enum(['ban_ip', 'pardon_ip']),
  ip: z.string().trim().min(1, 'server.playersPage.errors.missingIp'),
  reason: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

const actionSchema = z.discriminatedUnion('intent', [valueSchema, ipSchema]);

type DisplayEntry = { label: string; hint?: string; value: string };

function toDisplay(entry: { name?: string; uuid?: string; ip?: string }): DisplayEntry {
  const label = entry.name ?? entry.ip ?? entry.uuid ?? '';
  const hint = entry.uuid && entry.name ? entry.uuid : entry.ip && entry.name ? entry.ip : undefined;
  const value = entry.name ?? entry.ip ?? entry.uuid ?? '';
  return { label, hint, value };
}

function ListPanel({
  title,
  items,
  emptyLabel,
  renderActions,
}: {
  title: string;
  items: DisplayEntry[];
  emptyLabel: string;
  renderActions: (item: DisplayEntry) => React.ReactNode;
}) {
  return (
    <Paper withBorder p="md">
      <Stack>
        <Title order={3}>{title}</Title>
        <Divider />
        {items.length === 0 ? (
          <Text c="dimmed">{emptyLabel}</Text>
        ) : (
          <Stack gap="xs">
            {items.map((it) => (
              <Paper key={it.value} withBorder p="sm">
                <Group justify="space-between" align="center">
                  <div>
                    <Text fw={600}>{it.label}</Text>
                    {it.hint && (
                      <Text c="dimmed" fz="sm">
                        {it.hint}
                      </Text>
                    )}
                  </div>
                  {renderActions(it)}
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

export async function loader({ params: { uid }, request }: Route.LoaderArgs) {
  await requireAuth(request);
  const whitelist = await listWhitelist(uid);
  const ops = await listOps(uid);
  const bannedPlayers = await listBannedPlayers(uid);
  const bannedIps = await listBannedIps(uid);

  return {
    whitelist: whitelist.map(toDisplay),
    ops: ops.map(toDisplay),
    bannedPlayers: bannedPlayers.map(toDisplay),
    bannedIps: bannedIps.map((b) => toDisplay({ ip: b.ip, name: b.ip })),
  };
}

export async function action({ params: { uid }, request }: Route.ActionArgs) {
  await requireAuth(request);

  const result = await parseFormData(request, actionSchema);
  if (result.error) return validationError(result.error, result.submittedData);

  const data = result.data;

  if (data.intent === 'whitelist_add') {
    await whitelistAdd(uid, data.value);
    return { ok: true };
  }
  if (data.intent === 'whitelist_remove') {
    await whitelistRemove(uid, data.value);
    return { ok: true };
  }
  if (data.intent === 'op_add') {
    await opAdd(uid, data.value);
    return { ok: true };
  }
  if (data.intent === 'op_remove') {
    await opRemove(uid, data.value);
    return { ok: true };
  }
  if (data.intent === 'ban_player') {
    await banPlayer(uid, data.value, data.reason);
    return { ok: true };
  }
  if (data.intent === 'pardon_player') {
    await pardonPlayer(uid, data.value);
    return { ok: true };
  }
  if (data.intent === 'ban_ip') {
    await banIp(uid, data.ip, data.reason);
    return { ok: true };
  }
  if (data.intent === 'pardon_ip') {
    await pardonIp(uid, data.ip);
    return { ok: true };
  }

  return validationError(
    { formId: result.formId, fieldErrors: { intent: 'server.playersPage.errors.invalidIntent' } },
    result.submittedData,
  );
}

export default function PlayersPage({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation();

  const parseError = (error: string | null) => {
    if (error === 'server.playersPage.errors.invalidIntent') return t(($) => $.server.playersPage.errors.invalidIntent);
    if (error === 'server.playersPage.errors.missingValue') return t(($) => $.server.playersPage.errors.missingValue);
    if (error === 'server.playersPage.errors.missingIp') return t(($) => $.server.playersPage.errors.missingIp);
    return error;
  };

  return (
    <Stack>
      <Title order={2}>{t(($) => $.server.playersPage.title)}</Title>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper withBorder p="md">
          <Title order={3}>{t(($) => $.server.playersPage.whitelist)}</Title>
          <ValidatedForm method="post" schema={valueSchema} defaultValues={{ intent: 'whitelist_add', value: '' }}>
            {(form) => (
              <Stack mt="sm">
                <input type="hidden" {...form.getInputProps('intent')} value="whitelist_add" />
                <TextInput
                  label={t(($) => $.server.playersPage.valueLabel)}
                  {...form.getInputProps('value')}
                  error={parseError(form.error('value'))}
                />
                <Button type="submit" loading={form.formState.isSubmitting}>
                  {t(($) => $.server.playersPage.add)}
                </Button>
              </Stack>
            )}
          </ValidatedForm>
        </Paper>

        <Paper withBorder p="md">
          <Title order={3}>{t(($) => $.server.playersPage.ops)}</Title>
          <ValidatedForm method="post" schema={valueSchema} defaultValues={{ intent: 'op_add', value: '' }}>
            {(form) => (
              <Stack mt="sm">
                <input type="hidden" {...form.getInputProps('intent')} value="op_add" />
                <TextInput
                  label={t(($) => $.server.playersPage.valueLabel)}
                  {...form.getInputProps('value')}
                  error={parseError(form.error('value'))}
                />
                <Button type="submit" loading={form.formState.isSubmitting}>
                  {t(($) => $.server.playersPage.add)}
                </Button>
              </Stack>
            )}
          </ValidatedForm>
        </Paper>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <ListPanel
          title={t(($) => $.server.playersPage.whitelist)}
          items={loaderData.whitelist}
          emptyLabel={t(($) => $.server.playersPage.empty)}
          renderActions={(it) => (
            <ValidatedForm
              method="post"
              schema={valueSchema}
              defaultValues={{ intent: 'whitelist_remove', value: it.value }}
            >
              {(form) => (
                <>
                  <input type="hidden" {...form.getInputProps('intent')} value="whitelist_remove" />
                  <input type="hidden" {...form.getInputProps('value')} value={it.value} />
                  <Button size="xs" color="red" type="submit" loading={form.formState.isSubmitting}>
                    {t(($) => $.server.playersPage.remove)}
                  </Button>
                </>
              )}
            </ValidatedForm>
          )}
        />

        <ListPanel
          title={t(($) => $.server.playersPage.ops)}
          items={loaderData.ops}
          emptyLabel={t(($) => $.server.playersPage.empty)}
          renderActions={(it) => (
            <ValidatedForm method="post" schema={valueSchema} defaultValues={{ intent: 'op_remove', value: it.value }}>
              {(form) => (
                <>
                  <input type="hidden" {...form.getInputProps('intent')} value="op_remove" />
                  <input type="hidden" {...form.getInputProps('value')} value={it.value} />
                  <Button size="xs" color="red" type="submit" loading={form.formState.isSubmitting}>
                    {t(($) => $.server.playersPage.remove)}
                  </Button>
                </>
              )}
            </ValidatedForm>
          )}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper withBorder p="md">
          <Title order={3}>{t(($) => $.server.playersPage.bannedPlayers)}</Title>
          <ValidatedForm
            method="post"
            schema={valueSchema}
            defaultValues={{ intent: 'ban_player', value: '', reason: '' }}
          >
            {(form) => (
              <Stack mt="sm">
                <input type="hidden" {...form.getInputProps('intent')} value="ban_player" />
                <TextInput
                  label={t(($) => $.server.playersPage.valueLabel)}
                  {...form.getInputProps('value')}
                  error={parseError(form.error('value'))}
                />
                <TextInput label={t(($) => $.server.playersPage.reasonLabel)} {...form.getInputProps('reason')} />
                <Button type="submit" color="red" loading={form.formState.isSubmitting}>
                  {t(($) => $.server.playersPage.ban)}
                </Button>
              </Stack>
            )}
          </ValidatedForm>
        </Paper>

        <Paper withBorder p="md">
          <Title order={3}>{t(($) => $.server.playersPage.bannedIps)}</Title>
          <ValidatedForm method="post" schema={ipSchema} defaultValues={{ intent: 'ban_ip', ip: '', reason: '' }}>
            {(form) => (
              <Stack mt="sm">
                <input type="hidden" {...form.getInputProps('intent')} value="ban_ip" />
                <TextInput
                  label={t(($) => $.server.playersPage.ipLabel)}
                  {...form.getInputProps('ip')}
                  error={parseError(form.error('ip'))}
                />
                <TextInput label={t(($) => $.server.playersPage.reasonLabel)} {...form.getInputProps('reason')} />
                <Button type="submit" color="red" loading={form.formState.isSubmitting}>
                  {t(($) => $.server.playersPage.ban)}
                </Button>
              </Stack>
            )}
          </ValidatedForm>
        </Paper>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <ListPanel
          title={t(($) => $.server.playersPage.bannedPlayers)}
          items={loaderData.bannedPlayers}
          emptyLabel={t(($) => $.server.playersPage.empty)}
          renderActions={(it) => (
            <ValidatedForm
              method="post"
              schema={valueSchema}
              defaultValues={{ intent: 'pardon_player', value: it.value }}
            >
              {(form) => (
                <>
                  <input type="hidden" {...form.getInputProps('intent')} value="pardon_player" />
                  <input type="hidden" {...form.getInputProps('value')} value={it.value} />
                  <Button size="xs" color="green" type="submit" loading={form.formState.isSubmitting}>
                    {t(($) => $.server.playersPage.unban)}
                  </Button>
                </>
              )}
            </ValidatedForm>
          )}
        />

        <ListPanel
          title={t(($) => $.server.playersPage.bannedIps)}
          items={loaderData.bannedIps}
          emptyLabel={t(($) => $.server.playersPage.empty)}
          renderActions={(it) => (
            <ValidatedForm method="post" schema={ipSchema} defaultValues={{ intent: 'pardon_ip', ip: it.value }}>
              {(form) => (
                <>
                  <input type="hidden" {...form.getInputProps('intent')} value="pardon_ip" />
                  <input type="hidden" {...form.getInputProps('ip')} value={it.value} />
                  <Button size="xs" color="green" type="submit" loading={form.formState.isSubmitting}>
                    {t(($) => $.server.playersPage.unban)}
                  </Button>
                </>
              )}
            </ValidatedForm>
          )}
        />
      </SimpleGrid>
    </Stack>
  );
}
