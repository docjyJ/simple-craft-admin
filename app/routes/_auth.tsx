import type { Route } from './+types/_auth';
import { AppShell, Burger, Button, Group, NavLink } from '@mantine/core';
import { Link, Outlet, redirect } from 'react-router';
import { IconServer } from '@tabler/icons-react';
import { useState } from 'react';
import { getUser } from '~/server/session';

export async function loader({ request }: Route.LoaderArgs) {
  return getUser(request).then((user) => (user ? { user } : redirect('/login')));
}

export default function Shell({ loaderData: { user } }: Route.ComponentProps) {
  const [opened, setOpened] = useState(false);

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
    >
      <AppShell.Header>
        <Group justify="space-between" w="100%" px="md">
          <Group>
            <Burger
              opened={opened}
              onClick={() => setOpened((o) => !o)}
              hiddenFrom="sm"
              size="sm"
            />
            <div>SimpleCraftAdmin</div>
          </Group>
          <Group>
            <div>{user.username}</div>
            <Button component={Link} to="/logout" size="xs" variant="outline">
              Logout
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <NavLink component={Link} to="/servers" label="Servers" leftSection={<IconServer />} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
