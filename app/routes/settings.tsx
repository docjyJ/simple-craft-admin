import type { Route } from './+types/settings';
import { redirect } from 'react-router';
import { requireAuth } from '~/utils.server/session';
import { commitTheme, getTheme } from '~/utils.server/theme';
import { Button, Container, Paper, SegmentedControl, Stack, Title } from '@mantine/core';

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const theme = await getTheme(request);
  return { theme };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const theme = formData.get('theme');
  const value: 'light' | 'dark' | 'auto' = theme === 'light' || theme === 'dark' || theme === 'auto' ? theme : 'auto';
  const cookie = await commitTheme(value);
  return redirect('/settings', { headers: { 'Set-Cookie': cookie } });
}

export default function Settings({ loaderData }: Route.ComponentProps) {
  return (
    <Container size={520} my={40}>
      <Title order={2} mb="md">
        Settings
      </Title>
      <Paper withBorder p="lg" radius="md">
        <form method="post">
          <Stack>
            <SegmentedControl
              name="theme"
              fullWidth
              data={[
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
                { label: 'Auto', value: 'auto' },
              ]}
              defaultValue={loaderData.theme}
            />
            <Button type="submit">Save</Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
