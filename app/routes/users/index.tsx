import { ActionIcon, Button, Group, Paper, Table, Title } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { listUsers, requireAuth } from '~/utils.server/session';
import type { Route } from './+types/index';

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, { admin: true });
  const users = await listUsers();
  return { users };
}

export default function UsersIndex({ loaderData: { users } }: Route.ComponentProps) {
  const { t } = useTranslation();
  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={2}>{t(($) => $.users.index.title)}</Title>
        <Button component={Link} to="/users/new">
          {t(($) => $.users.index.newUser)}
        </Button>
      </Group>
      <Paper withBorder>
        <Table.ScrollContainer minWidth={600} type="native">
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t(($) => $.users.index.username)}</Table.Th>
                <Table.Th>{t(($) => $.users.index.name)}</Table.Th>
                <Table.Th>{t(($) => $.users.index.role)}</Table.Th>
                <Table.Th>{t(($) => $.users.index.action)}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map((u) => (
                <Table.Tr key={u.id}>
                  <Table.Td>{u.username}</Table.Td>
                  <Table.Td>{u.name}</Table.Td>
                  <Table.Td>{u.role}</Table.Td>
                  <Table.Td>
                    <Group gap={8}>
                      <ActionIcon
                        component={Link}
                        to={`/users/${u.id}/edit`}
                        variant="filled"
                        aria-label={t(($) => $.users.index.editUser)}
                      >
                        <IconEdit style={{ width: '70%', height: '70%' }} stroke={1.5} />
                      </ActionIcon>
                      <ActionIcon
                        component={Link}
                        to={`/users/${u.id}/delete`}
                        variant="light"
                        color="red"
                        aria-label={t(($) => $.users.index.deleteUser)}
                      >
                        <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </>
  );
}
