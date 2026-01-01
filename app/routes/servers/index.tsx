import { ActionIcon, Badge, Button, Group, Paper, Table, Text, Title } from '@mantine/core';
import { IconAccessPoint, IconAccessPointOff, IconEdit } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import ServerPlayerCount from '~/components/ServerPlayerCount';
import ServerUser from '~/components/ServerUser';
import { fullListMinecraftServers } from '~/utils.server/minecraft-servers';
import { requireAuth } from '~/utils.server/session';
import type { Route } from './+types/index';

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const servers = await fullListMinecraftServers();
  return { servers };
}

export default function ServersIndex({ loaderData: { servers } }: Route.ComponentProps) {
  const { t } = useTranslation();
  const rows = servers.map(({ uid, server_data }) => (
    <Table.Tr key={uid}>
      <Table.Td>
        <ServerUser name={server_data.name} motd={server_data.motd} icon={server_data.server_icon} />
      </Table.Td>
      <Table.Td>
        <ServerPlayerCount max_players={server_data.max_players} online_players={server_data.online_players} />
      </Table.Td>
      <Table.Td>
        <Text fz="sm">{server_data.server_version ?? t(($) => $.servers.index.unknown)}</Text>
      </Table.Td>
      <Table.Td>
        {server_data.is_online ? (
          <Badge color="green" size="sm" leftSection={<IconAccessPoint size={12} />}>
            {t(($) => $.servers.index.online)}
          </Badge>
        ) : (
          <Badge color="red" size="sm" leftSection={<IconAccessPointOff size={12} />}>
            {t(($) => $.servers.index.offline)}
          </Badge>
        )}
      </Table.Td>
      <Table.Td>
        <ActionIcon
          component={Link}
          to={`/servers/${uid}`}
          variant="filled"
          aria-label={t(($) => $.servers.index.settings)}
        >
          <IconEdit style={{ width: '70%', height: '70%' }} stroke={1.5} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  ));
  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={2}>{t(($) => $.servers.index.title)}</Title>
        <Button component={Link} to="/servers/new">
          {t(($) => $.servers.index.newServer)}
        </Button>
      </Group>
      <Paper withBorder>
        <Table.ScrollContainer minWidth={800} type="native">
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t(($) => $.servers.index.server)}</Table.Th>
                <Table.Th>{t(($) => $.servers.index.players)}</Table.Th>
                <Table.Th>{t(($) => $.servers.index.version)}</Table.Th>
                <Table.Th>{t(($) => $.servers.index.status)}</Table.Th>
                <Table.Th>{t(($) => $.servers.index.action)}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.length ? (
                rows
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text size="sm" c="dimmed">
                      {t(($) => $.servers.empty)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </>
  );
}
