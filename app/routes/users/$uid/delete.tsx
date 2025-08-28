import type { Route } from './+types/delete';
import { data, Form, Link, redirect } from 'react-router';
import { deleteUser, getUserById, requireAuth } from '~/utils.server/session';
import { Alert, Button, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconAlertHexagon } from '@tabler/icons-react';

async function getUserByStringId(uid: string | undefined) {
  if (!uid) throw data('Invalid user ID', { status: 400 });
  const id = Number(uid);
  if (Number.isNaN(id)) throw data('Invalid user ID', { status: 400 });
  const user = await getUserById(id);
  if (!user) throw data('User not found', { status: 404 });
  return { id, user };
}

export async function loader({ request, params: { uid } }: Route.LoaderArgs) {
  await requireAuth(request, { admin: true });
  const { user } = await getUserByStringId(uid);
  return { user };
}

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  await requireAuth(request, { admin: true });
  const { id } = await getUserByStringId(uid);
  await deleteUser(id);
  throw redirect('/users');
}

export default function DeleteUser({ loaderData: { user } }: Route.ComponentProps) {
  return (
    <Container size={520} my={40}>
      <Title ta="center" mb="md">
        Delete user
      </Title>
      <Paper withBorder shadow="sm" p="lg" radius="md">
        <Form method="post">
          <Stack>
            <Alert color="red" title="Warning" icon={<IconAlertHexagon />}>This action is irreversible.</Alert>
            <Text>Confirm deletion of the following user:</Text>
            <Text fw={500}>Username: {user.username}</Text>
            <Text>Name: {user.name}</Text>
            <Text>Role: {user.role}</Text>
            <Group justify="flex-end">
              <Button variant="outline" component={Link} to="/users">
                Cancel
              </Button>
              <Button color="red" type="submit">
                Delete
              </Button>
            </Group>
          </Stack>
        </Form>
      </Paper>
    </Container>
  );
}
