import type { Route } from './+types/$uid';
import { data, Form, Outlet, useLocation, useNavigate } from 'react-router';
import { Button, Group, Paper, Stack, Tabs, Text } from '@mantine/core';
import { IconPlayerStop, IconPower } from '@tabler/icons-react';
import ServerUser from '~/components/ServerUser';
import ServerPlayerCount from '~/components/ServerPlayerCount';
import { getOrCreateServer } from '~/utils.server/server-minecraft';
import { requireAuth } from '~/utils.server/session';
import { isValidUid } from '~/utils.server/path-validation';
import { useTranslation } from 'react-i18next';

export async function loader({ params: { uid }, request }: Route.LoaderArgs) {
  await requireAuth(request);
  if (!isValidUid(uid)) {
    throw data(`Invalid uid: '${uid}'.`, { status: 400 });
  }
  const instance = getOrCreateServer(uid);
  return {
    server_data: await instance.getServerData(),
    is_online: instance.isRunning(),
  };
}

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const actionType = formData.get('running-action');
  const instance = getOrCreateServer(uid);
  if (actionType === 'start') await instance.start();
  if (actionType === 'stop') instance.forceKill();
}

export default function ServerLayout({
  loaderData: { server_data, is_online },
  params: { uid },
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();

  return (
    <Stack h="100%" justify="space-between" p="md">
      <Paper withBorder p="md">
        <Group justify="space-between">
          <ServerUser name={server_data.name} motd={server_data.motd} icon={server_data.server_icon} />
          <ServerPlayerCount max_players={server_data.max_players} online_players={server_data.online_players} />
          <Text fz="sm">{server_data.server_version ?? t(($) => $.server.version.unknown)}</Text>
          <Form method="post">
            <Button
              color={is_online ? 'red' : 'green'}
              type="submit"
              name="running-action"
              value={is_online ? 'stop' : 'start'}
              leftSection={is_online ? <IconPlayerStop size={18} /> : <IconPower size={18} />}
            >
              {is_online ? t(($) => $.server.actions.forceStop) : t(($) => $.server.actions.startServer)}
            </Button>
          </Form>
        </Group>
      </Paper>
      <Paper withBorder p="md">
        <Tabs
          value={pathname}
          onChange={(value) => {
            if (value !== null) navigate(value);
          }}
          variant="pills"
        >
          <Tabs.List>
            <Tabs.Tab value={`/servers/${uid}`}>{t(($) => $.server.tabs.console)}</Tabs.Tab>
            <Tabs.Tab value={`/servers/${uid}/players`}>{t(($) => $.server.tabs.players)}</Tabs.Tab>
            <Tabs.Tab value={`/servers/${uid}/files`}>{t(($) => $.server.tabs.files)}</Tabs.Tab>
            <Tabs.Tab value={`/servers/${uid}/settings`}>{t(($) => $.server.tabs.settings)}</Tabs.Tab>
            <Tabs.Tab value={`/servers/${uid}/management`}>{t(($) => $.server.tabs.management)}</Tabs.Tab>
            <Tabs.Tab value={`/servers/${uid}/backup`}>{t(($) => $.server.tabs.backup)}</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </Paper>
      <Outlet />
    </Stack>
  );
}
