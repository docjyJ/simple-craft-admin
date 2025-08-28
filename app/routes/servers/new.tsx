import { redirect } from 'react-router';
import type { Route } from './+types/new';
import { z } from 'zod';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { createMinecraftServer } from '~/utils.server/minecraft-servers';
import { requireAuth } from '~/utils.server/session';
import { Button, Container, Paper, Stack, TextInput, Title } from '@mantine/core';

const schema = z.object({
  name: z.string().min(1, 'Server name is required'),
});

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const result = await parseFormData(request, schema);
  if (result.error) return validationError(result.error, result.submittedData);
  const uid = await createMinecraftServer(result.data);
  return redirect(`/servers/${uid}`);
}

export default function NewServer() {
  return (
    <Container size={520} my={40}>
      <Title ta="center" mb="md">
        Create a new server
      </Title>
      <Paper withBorder shadow="sm" p="lg" radius="md">
        <ValidatedForm method="post" schema={schema} defaultValues={{ name: '' }}>
          {(form) => (
            <Stack>
              <TextInput
                name="serverName"
                label="Server name"
                placeholder="My Awesome Server"
                required
                error={form.error('name')}
                {...form.getInputProps('name')}
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
