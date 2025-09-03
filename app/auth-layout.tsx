import type { Route } from './+types/auth-layout';
import { AppShell, Burger, Button, Group, Image, NavLink, Text, Title } from '@mantine/core';
import { Link, Outlet, redirect } from 'react-router';
import { IconGauge, IconServer, IconSettings, IconUsers } from '@tabler/icons-react';
import { useState } from 'react';
import { getUser } from '~/utils.server/session';
import { useTranslation } from 'react-i18next';

export async function loader({ request }: Route.LoaderArgs) {
  return getUser(request).then((user) => (user ? { user } : redirect('/login')));
}

export default function Shell({ loaderData: { user } }: Route.ComponentProps) {
  const [opened, setOpened] = useState(false);
  const { t } = useTranslation();

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
        <Group justify="space-between" align="center" w="100%" px="md" h="100%">
          <Group align="center" gap="sm" wrap="nowrap">
            <Burger opened={opened} onClick={() => setOpened((o) => !o)} hiddenFrom="sm" size="sm" />
            <Image
              src="/Applied-Energistics-2_ME-Drive.png"
              alt="Logo Applied Energistics 2"
              height={36}
              width={36}
              fit="contain"
            />
            <Title order={3} fw={700} style={{ letterSpacing: 1 }}>
              {t(($) => $.app.title)}
            </Title>
          </Group>
          <Group align="center" gap="xs">
            <Text fw={500}>{user.username}</Text>
            <Button component={Link} to="/logout" size="xs" variant="outline" color="red">
              {t(($) => $.auth.logout)}
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <NavLink component={Link} to="/dashboard" label={t(($) => $.nav.dashboard)} leftSection={<IconGauge />} />
        <NavLink component={Link} to="/servers" label={t(($) => $.nav.servers)} leftSection={<IconServer />} />
        {user.role === 'ADMIN' && (
          <NavLink component={Link} to="/users" label={t(($) => $.nav.users)} leftSection={<IconUsers />} />
        )}
        <NavLink component={Link} to="/settings" label={t(($) => $.nav.settings)} leftSection={<IconSettings />} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
