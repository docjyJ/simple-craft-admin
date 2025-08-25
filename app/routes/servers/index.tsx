import { createMinecraftServer, fullListMinecraftServers } from '~/utils.server/minecraft-servers';
import type { Route } from './+types/index';
import { ActionIcon, Badge, Button, Group, Modal, Paper, Stack, Table, Text, TextInput } from '@mantine/core';
import { IconAccessPoint, IconAccessPointOff, IconEdit } from '@tabler/icons-react';
import { Link, redirect } from 'react-router';
import ServerUser from '~/components/ServerUser';
import ServerPlayerCount from '~/components/ServerPlayerCount';
import { useState } from 'react';
import { z } from 'zod';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';

export async function loader() {
  const servers = await fullListMinecraftServers();
  return { servers };
}

const schema = z.object({
  serverName: z.string().min(1, 'Name is required'),
});

export async function action({ request }: { request: Request }) {
  const result = await parseFormData(request, schema);
  if (result.error) {
    return validationError(result.error, result.submittedData);
  }
  const uid = await createMinecraftServer({ name: result.data.serverName });
  return redirect(`/servers/${uid}`);
}

export default function ServersIndex({ loaderData: { servers } }: Route.ComponentProps) {
  const [opened, setOpened] = useState(false);
  const rows = servers.map(({ uid, server_data }) => (
    <Table.Tr key={uid}>
      <Table.Td>
        <ServerUser name={server_data.name} motd={server_data.motd} icon={server_data.server_icon} />
      </Table.Td>
      <Table.Td>
        <ServerPlayerCount max_players={server_data.max_players} online_players={server_data.online_players} />
      </Table.Td>
      <Table.Td>
        <Text fz="sm">{server_data.server_version ?? 'Unknown'}</Text>
      </Table.Td>
      <Table.Td>
        {server_data.is_online ? (
          <Badge color="green" size="sm" leftSection={<IconAccessPoint size={12} />}>
            Online
          </Badge>
        ) : (
          <Badge color="red" size="sm" leftSection={<IconAccessPointOff size={12} />}>
            Offline
          </Badge>
        )}
      </Table.Td>
      <Table.Td>
        <ActionIcon component={Link} to={`/servers/${uid}`} variant="filled" aria-label="Settings">
          <IconEdit style={{ width: '70%', height: '70%' }} stroke={1.5} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  ));
  return (
    <>
      <h1>List of Minecraft Servers</h1>
      <Button onClick={() => setOpened(true)} mb="md">
        Create New Server
      </Button>
      <Modal opened={opened} onClose={() => setOpened(false)} title="Create New Server" centered>
        <ValidatedForm
          schema={schema}
          method="post"
          defaultValues={{ serverName: '' }}
          onSubmit={() => setOpened(false)}
        >
          {(form) => (
            <Stack>
              <TextInput
                label="Server Name"
                placeholder="Enter server name"
                required
                {...form.getInputProps('serverName')}
              />
              <Group justify="flex-end">
                <Button type="submit" color="blue" loading={form.formState.isSubmitting}>
                  Create
                </Button>
                <Button variant="outline" loading={form.formState.isSubmitting} onClick={() => setOpened(false)}>
                  Cancel
                </Button>
              </Group>
            </Stack>
          )}
        </ValidatedForm>
      </Modal>
      <Paper withBorder>
        <Table.ScrollContainer minWidth={800} type="native">
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Server</Table.Th>
                <Table.Th>Players</Table.Th>
                <Table.Th>Version</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </>
  );
}
