import { redirect } from 'react-router';
import type { Route } from './+types/new';
import { z } from 'zod';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { createMinecraftServer } from '~/utils.server/minecraft-servers';
import { getUser } from '~/utils.server/session';
import { Button, Container, Paper, Stack, TextInput, Title } from '@mantine/core';

const schema = z.object({
  serverName: z.string().min(1, 'Server name is required'),
});

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  if (!user) return redirect('/login');
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const user = await getUser(request);
  if (!user) return redirect('/login');
  const result = await parseFormData(request, schema);
  if (result.error) return validationError(result.error, result.submittedData);
  const uid = await createMinecraftServer({ name: result.data.serverName });
  return redirect(`/servers/${uid}`);
}

export default function NewServer() {
  return (
    <Container size={520} my={40}>
      <Title ta="center" mb="md">
        Create a new server
      </Title>
      <Paper withBorder shadow="sm" p="lg" radius="md">
        <ValidatedForm method="post" schema={schema} defaultValues={{ serverName: '' }}>
          {(form) => (
            <Stack>
              <TextInput
                name="serverName"
                label="Server name"
                placeholder="My Awesome Server"
                required
                error={form.error('serverName')}
                {...form.getInputProps('serverName')}
              />
              <Button type="submit" loading={form.formState.isSubmitting}>
                Create
              </Button>
            </Stack>
          )}
        </ValidatedForm>
      </Paper>
    </Container>
  );
}
