import { Alert, Button, NumberInput, Paper, Select, Stack, TextInput, Title } from '@mantine/core';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { IconAlertHexagon, IconDeviceFloppy, IconInfoHexagon } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { getOrCreateServer } from '~/utils.server/server-minecraft';
import { requireAuth } from '~/utils.server/session';
import type { Route } from './+types/settings';

const schema = z.object({
  name: z.coerce.string().min(1, 'server.settingsPage.nameRequired'),
  server_port: z.coerce
    .number()
    .int()
    .min(1, 'server.settingsPage.portRange')
    .max(65535, 'server.settingsPage.portRange'),
  java_version: z.string().min(1, 'server.settingsPage.javaVersionRequired'),
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
  const { t } = useTranslation();
  const parseError = (error: string | null) => {
    if (error === 'server.settingsPage.nameRequired') return t(($) => $.server.settingsPage.nameRequired);
    if (error === 'server.settingsPage.portRange') return t(($) => $.server.settingsPage.portRange);
    if (error === 'server.settingsPage.javaVersionRequired') return t(($) => $.server.settingsPage.javaVersionRequired);
    return error;
  };
  return (
    <ValidatedForm
      id="settings-form"
      method="post"
      schema={schema}
      defaultValues={{
        name: serverData.name,
        server_port: serverData.server_port,
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
              <Title order={3}>{t(($) => $.server.settingsPage.title)}</Title>
              <input name="type" type="hidden" value="settings" />
              <TextInput
                name="name"
                label={t(($) => $.server.settingsPage.name)}
                error={parseError(form.error('name'))}
                {...form.getInputProps('name')}
              />
              <NumberInput
                name="server_port"
                label={t(($) => $.server.settingsPage.port)}
                min={1}
                max={65535}
                error={parseError(form.error('server_port'))}
                {...form.getInputProps('server_port')}
              />
              <Select
                name="java_version"
                label={t(($) => $.server.settingsPage.javaVersion)}
                data={[
                  { value: 'default', label: t(($) => $.server.settingsPage.javaDefault) },
                  { value: '21', label: 'Java 21' },
                  { value: '17', label: 'Java 17' },
                  { value: '11', label: 'Java 11' },
                  { value: '8', label: 'Java 8' },
                ]}
                error={parseError(form.error('java_version'))}
                {...cleanSelectInputProps}
              />
              <Button type="submit" leftSection={<IconDeviceFloppy size={18} />} loading={form.formState.isSubmitting}>
                {t(($) => $.server.settingsPage.save)}
              </Button>

              {form.formState.submitStatus === 'success' && (
                <Alert title={t(($) => $.server.settingsPage.updatedTitle)} color="green" icon={<IconInfoHexagon />}>
                  {t(($) => $.server.settingsPage.updatedMsg)}
                </Alert>
              )}
              {form.formState.submitStatus === 'error' && (
                <Alert title={t(($) => $.server.settingsPage.errorTitle)} color="red" icon={<IconAlertHexagon />}>
                  {t(($) => $.server.settingsPage.errorMsg)}
                </Alert>
              )}
            </Stack>
          </Paper>
        );
      }}
    </ValidatedForm>
  );
}
