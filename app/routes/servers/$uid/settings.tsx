import { Alert, Button, NumberInput, Stack, TextInput } from '@mantine/core';
import { getServerData, updateConfig } from '~/server/minecraft-servers';
import type { Route } from './+types/settings';
import { IconAlertHexagon, IconDeviceFloppy, IconInfoHexagon } from '@tabler/icons-react';
import { z } from 'zod';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';

const schema = z.object({
  name: z.coerce.string().min(1, 'Server name is required'),
  server_port: z.coerce
    .number()
    .int()
    .min(1, 'Port must be between 1 and 65535')
    .max(65535, 'Port must be between 1 and 65535'),
  jar_url: z.url({
    protocol: /^https?$/,
    hostname: z.regexes.domain,
  }),
});

export async function loader({ params: { uid } }: Route.LoaderArgs) {
  return getServerData(uid).then((serverData) => ({ serverData }));
}

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  const result = await parseFormData(request, schema);
  if (result.error) {
    return validationError(result.error, result.submittedData);
  }
  return updateConfig(uid, result.data);
}

export default function SettingsServer({ loaderData: { serverData } }: Route.ComponentProps) {
  return (
    <Stack>
      <ValidatedForm
        id="settings-form"
        method="post"
        schema={schema}
        defaultValues={{
          name: serverData.name,
          server_port: serverData.server_port,
          jar_url: serverData.jar_url,
        }}
      >
        {(form) => (
          <Stack justify="left">
            <input name="type" type="hidden" value="settings" />
            <TextInput
              name="name"
              label="Server Name"
              required
              error={form.error('name')}
              {...form.getInputProps('name')}
            />
            <NumberInput
              name="server_port"
              label="Server Port"
              required
              min={1}
              max={65535}
              error={form.error('server_port')}
              {...form.getInputProps('server_port')}
            />
            <TextInput
              label="Jar URL"
              required
              placeholder="https://example.com/path/to/server.jar"
              error={form.error('jar_url')}
              {...form.getInputProps('jar_url')}
            />
            <Button
              type="submit"
              leftSection={<IconDeviceFloppy size={18} />}
              loading={form.formState.isSubmitting}
            >
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
        )}
      </ValidatedForm>
    </Stack>
  );
}
