import { Link } from 'react-router';
import type { Route } from './+types/index';
import { fullListMinecraftServers } from '~/utils.server/minecraft-servers';
import { getUser } from '~/utils.server/session';
import { Avatar, Badge, Button, Container, Group, Paper, Table, Text, Title } from '@mantine/core';
import { IconAccessPoint, IconAccessPointOff, IconDashboard, IconKey } from '@tabler/icons-react';
import ServerUser from '~/components/ServerUser';
import ServerPlayerCount from '~/components/ServerPlayerCount';
import { useTranslation } from 'react-i18next';

export async function loader({ request }: Route.LoaderArgs) {
  const [servers, user] = await Promise.all([fullListMinecraftServers(), getUser(request)]);
  return { servers, user };
}

export default function PublicStatus({ loaderData: { servers, user } }: Route.ComponentProps) {
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
        <Text fz="sm">{server_data.server_version ?? t('server.version.unknown')}</Text>
      </Table.Td>
      <Table.Td>
        {server_data.is_online ? (
          <Badge color="green" size="sm" leftSection={<IconAccessPoint size={12} />}>
            {t('status.online')}
          </Badge>
        ) : (
          <Badge color="red" size="sm" leftSection={<IconAccessPointOff size={12} />}>
            {t('status.offline')}
          </Badge>
        )}
      </Table.Td>
    </Table.Tr>
  ));
  return (
    <Container component="main" pt="md" pb="xl">
      <Group justify="space-between" mb="lg">
        <Group gap="sm">
          <Avatar src="/Applied-Energistics-2_ME-Drive.png" radius="sm" />
          <Title order={3}>{t('app.brand')}</Title>
        </Group>
        {user ? (
          <Button component={Link} to="/dashboard" leftSection={<IconDashboard size={14} />}>
            {t('public.dashboard')}
          </Button>
        ) : (
          <Button component={Link} to="/login" leftSection={<IconKey size={14} />}>
            {t('public.login')}
          </Button>
        )}
      </Group>
      <Paper withBorder>
        <Table.ScrollContainer minWidth={800} type="native">
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('public.table.server')}</Table.Th>
                <Table.Th>{t('public.table.players')}</Table.Th>
                <Table.Th>{t('public.table.version')}</Table.Th>
                <Table.Th>{t('public.table.status')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.length ? (
                rows
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text size="sm" c="dimmed">
                      {t('public.table.empty')}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </Container>
  );
}
