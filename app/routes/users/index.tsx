import type { Route } from './+types/index';
import { redirect, Link } from 'react-router';
import { getUser, listUsers } from '~/utils.server/session';
import { ActionIcon, Button, Group, Paper, Table, Title } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';

export async function loader({ request }: Route.LoaderArgs) {
  const current = await getUser(request);
  if (!current) return redirect('/login');
  if (current.role !== 'ADMIN') return redirect('/servers');
  const users = await listUsers();
  return { users };
}

export default function UsersIndex({ loaderData: { users } }: Route.ComponentProps) {
  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={2}>Users</Title>
        <Button component={Link} to="/users/new">
          New User
        </Button>
      </Group>
      <Paper withBorder>
        <Table.ScrollContainer minWidth={600} type="native">
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Username</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map((u) => (
                <Table.Tr key={u.id}>
                  <Table.Td>{u.username}</Table.Td>
                  <Table.Td>{u.name}</Table.Td>
                  <Table.Td>{u.role}</Table.Td>
                  <Table.Td>
                    <ActionIcon component={Link} to={`/users/${u.id}/edit`} variant="filled" aria-label="Edit user">
                      <IconEdit style={{ width: '70%', height: '70%' }} stroke={1.5} />
                    </ActionIcon>
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
