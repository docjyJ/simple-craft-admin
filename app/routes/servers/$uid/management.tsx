import { Alert, Button, Paper, Stack, Title } from '@mantine/core';
import type { Route } from './+types/management';
import { getOrCreateServer } from '~/utils.server/server-minecraft';
import { IconAlertHexagon, IconDownload, IconInfoHexagon } from '@tabler/icons-react';
import { Form, useActionData, useNavigation } from 'react-router';

export async function loader({ params: { uid } }: Route.LoaderArgs) {
  const instance = getOrCreateServer(uid);
  return { serverData: await instance.getServerData() };
}

export async function action({ params: { uid } }: Route.ActionArgs) {
  const instance = getOrCreateServer(uid);
  try {
    await instance.updateJar();
    return { status: 'success' as const };
  } catch (e: any) {
    return { status: 'error' as const, message: e?.message || 'Unknown error' };
  }
}

export default function ManagementServer({ loaderData: { serverData } }: Route.ComponentProps) {
  const actionData = useActionData<typeof action>();
  const nav = useNavigation();
  const downloading = nav.state === 'submitting';
  return (
    <Paper withBorder p="md">
      <Stack>
        <Title order={3}>Server Management</Title>
        <div>Current jar URL: {serverData.jar_url || <em>Not set</em>}</div>
        <Form method="post">
          <Button
            type="submit"
            leftSection={<IconDownload size={18} />}
            loading={downloading}
            disabled={!serverData.jar_url}
          >
            Download / Update server.jar
          </Button>
        </Form>
        {actionData?.status === 'success' && (
          <Alert color="green" title="Jar Updated" icon={<IconInfoHexagon />}>
            server.jar downloaded successfully.
          </Alert>
        )}
        {actionData?.status === 'error' && (
          <Alert color="red" title="Update Failed" icon={<IconAlertHexagon />}>
            {actionData.message}
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
