import { Button, Group, Paper, Stack, Title } from '@mantine/core';
import { Link } from 'react-router';

export default function ManagementServer() {
  return (
    <Paper withBorder p="md">
      <Stack>
        <Title order={3}>Server Management</Title>
        <Group>
          <Button component={Link} to={`version`} variant="outline" size="xs">
            Version Management
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
