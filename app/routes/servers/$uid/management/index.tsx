import { Button, Group, Paper, Stack, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export default function ManagementServer() {
  const { t } = useTranslation();
  return (
    <Paper withBorder p="md">
      <Stack>
        <Title order={3}>{t(($) => $.server.management.title)}</Title>
        <Group>
          <Button component={Link} to={`version`} variant="outline" size="xs">
            {t(($) => $.server.management.versionManagement)}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
