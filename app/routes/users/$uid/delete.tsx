import { Alert, Button, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconAlertHexagon } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { data, Form, Link, redirect } from 'react-router';
import { deleteUser, getUserById, requireAuth } from '~/utils.server/session';
import type { Route } from './+types/delete';

export async function loader({ request, params: { uid } }: Route.LoaderArgs) {
  await requireAuth(request, { admin: true });
  const user = await getUserById(uid);
  if (!user) throw data('User not found', { status: 404 });
  return { user };
}

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  await requireAuth(request, { admin: true });
  await deleteUser(uid);
  throw redirect('/users');
}

export default function DeleteUser({ loaderData: { user } }: Route.ComponentProps) {
  const { t } = useTranslation();
  return (
    <Container size={520} my={40}>
      <Title ta="center" mb="md">
        {t(($) => $.users.delete.title)}
      </Title>
      <Paper withBorder shadow="sm" p="lg" radius="md">
        <Form method="post">
          <Stack>
            <Alert color="red" title={t(($) => $.users.delete.warning)} icon={<IconAlertHexagon />}>
              {t(($) => $.users.delete.irreversible)}
            </Alert>
            <Text>{t(($) => $.users.delete.confirm)}</Text>
            <Text fw={500}>
              {t(($) => $.users.delete.username)}: {user.username}
            </Text>
            <Text>
              {t(($) => $.users.delete.name)}: {user.name}
            </Text>
            <Text>
              {t(($) => $.users.delete.role)}: {user.role}
            </Text>
            <Group justify="flex-end">
              <Button variant="outline" component={Link} to="/users">
                {t(($) => $.users.delete.cancel)}
              </Button>
              <Button color="red" type="submit">
                {t(($) => $.users.delete.delete)}
              </Button>
            </Group>
          </Stack>
        </Form>
      </Paper>
    </Container>
  );
}
