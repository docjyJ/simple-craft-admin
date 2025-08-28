import { Alert, Button, NumberInput, Paper, Select, Stack, TextInput, Title } from '@mantine/core';
import type { Route } from './+types/settings';
import { IconAlertHexagon, IconDeviceFloppy, IconInfoHexagon } from '@tabler/icons-react';
import { z } from 'zod';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { getOrCreateServer } from '~/utils.server/server-minecraft';
import { requireAuth } from '~/utils.server/session';

const schema = z.object({
  name: z.coerce.string().min(1, 'Server name is required'),
  server_port: z.coerce
    .number()
    .int()
    .min(1, 'Port must be between 1 and 65535')
    .max(65535, 'Port must be between 1 and 65535'),
  jar_url: z.union([
    z.url({
      protocol: /^https?$/,
      hostname: z.regexes.domain,
    }),
    z.literal(''),
  ]),
  java_version: z.string().min(1, 'Select a Java version'),
});

export async function loader({ params: { uid }, request }: Route.LoaderArgs) {
  await requireAuth(request);
  const instance = getOrCreateServer(uid);
  return { serverData: await instance.getServerData() };
}

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  await requireAuth(request);
  const result = await parseFormData(request, schema);
  if (result.error) {
    return validationError(result.error, result.submittedData);
  }
  const instance = getOrCreateServer(uid);
  await instance.updateConfig(result.data);
  return null;
}

export default function SettingsServer({ loaderData: { serverData } }: Route.ComponentProps) {
  return (
    <ValidatedForm
      id="settings-form"
      method="post"
      schema={schema}
      defaultValues={{
        name: serverData.name,
        server_port: serverData.server_port,
        jar_url: serverData.jar_url,
        java_version: serverData.java_version,
      }}
    >
      {(form) => {
        const { value, ...selectInputProps } = form.getInputProps('java_version');
        const cleanValue = typeof value === 'number' ? value.toString() : typeof value === 'object' ? undefined : value;
        const cleanSelectInputProps = { value: cleanValue, ...selectInputProps };
        return (
          <Paper withBorder p="md">
            <Stack justify="left">
              <Title order={3}>Server Settings</Title>
              <input name="type" type="hidden" value="settings" />
              <TextInput name="name" label="Server Name" error={form.error('name')} {...form.getInputProps('name')} />
              <NumberInput
                name="server_port"
                label="Server Port"
                min={1}
                max={65535}
                error={form.error('server_port')}
                {...form.getInputProps('server_port')}
              />
              <TextInput
                label="Jar URL"
                placeholder="https://example.com/path/to/server.jar"
                error={form.error('jar_url')}
                {...form.getInputProps('jar_url')}
              />
              <Select
                name="java_version"
                label="Version Java"
                data={[
                  { value: 'default', label: 'Use default (Java 21)' },
                  { value: '21', label: 'Java 21' },
                  { value: '17', label: 'Java 17' },
                  { value: '11', label: 'Java 11' },
                  { value: '8', label: 'Java 8' },
                ]}
                error={form.error('java_version')}
                {...cleanSelectInputProps}
              />
              <Button type="submit" leftSection={<IconDeviceFloppy size={18} />} loading={form.formState.isSubmitting}>
                Save Settings
              </Button>

              {form.formState.submitStatus === 'success' && (
                <Alert title="Settings Updated" color="green" icon={<IconInfoHexagon />}>
                  The server settings have been updated successfully.
                </Alert>
              )}
              {form.formState.submitStatus === 'error' && (
                <Alert title="Error Updating Settings" color="red" icon={<IconAlertHexagon />}>
                  There was an error updating the server settings. Please check the form for errors.
                </Alert>
              )}
            </Stack>
          </Paper>
        );
      }}
    </ValidatedForm>
  );
}
