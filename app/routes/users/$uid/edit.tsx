import type { Route } from './+types/edit';
import { redirect, Link } from 'react-router';
import { z } from 'zod';
import { getUser, getUserById, updateUser } from '~/utils.server/session';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { Button, Container, Group, Paper, PasswordInput, Radio, Stack, Text, TextInput, Title } from '@mantine/core';

const schema = z.object({
  name: z.string().min(1, 'The full name is required'),
  role: z.enum(['ADMIN', 'USER']),
  password: z.union([z.string().min(6, 'The password must be at least 6 characters long'), z.literal('')]),
});

export async function loader({ request, params: { uid } }: Route.LoaderArgs) {
  const current = await getUser(request);
  if (!current) return redirect('/login');
  if (current.role !== 'ADMIN') return redirect('/servers');
  const id = Number(uid);
  if (Number.isNaN(id)) return redirect('/users');
  const user = await getUserById(id);
  if (!user) return redirect('/users');
  return { user };
}

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  const current = await getUser(request);
  if (!current) return redirect('/login');
  if (current.role !== 'ADMIN') return redirect('/servers');
  const id = Number(uid);
  if (Number.isNaN(id)) return redirect('/users');
  const existing = await getUserById(id);
  if (!existing) return redirect('/users');
  const result = await parseFormData(request, schema);
  if (result.error) return validationError(result.error, result.submittedData);
  await updateUser(id, { name: result.data.name, role: result.data.role, password: result.data.password });
  return redirect('/users');
}

export default function EditUser({ loaderData: { user } }: Route.ComponentProps) {
  return (
    <Container size={520} my={40}>
      <Title ta="center" mb="md">
        Edit user
      </Title>
      <Paper withBorder shadow="sm" p="lg" radius="md">
        <ValidatedForm method="post" schema={schema} defaultValues={{ name: user.name, role: user.role, password: '' }}>
          {(form) => (
            <Stack>
              <Text fw={500}>Username: {user.username}</Text>
              <TextInput
                name="name"
                label="Full name"
                required
                error={form.error('name')}
                {...form.getInputProps('name')}
              />
              <PasswordInput
                name="password"
                label="New password (leave blank to keep current)"
                error={form.error('password')}
                {...form.getInputProps('password')}
              />
              <Radio
                {...form.getInputProps('role', { type: 'radio', value: 'USER' })}
                error={form.error('role')}
                label="Standard user"
              />
              <Radio
                {...form.getInputProps('role', { type: 'radio', value: 'ADMIN' })}
                error={form.error('role')}
                label="Administrator"
              />
              <Group justify="flex-end">
                <Button variant="outline" component={Link} to="/users" disabled={form.formState.isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" loading={form.formState.isSubmitting}>
                  Save
                </Button>
              </Group>
            </Stack>
          )}
        </ValidatedForm>
      </Paper>
    </Container>
  );
}
