import type { Route } from './+types/edit';
import { data, Link } from 'react-router';
import { z } from 'zod';
import { getUserById, requireAuth, updateUser } from '~/utils.server/session';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import {
  Alert,
  Button,
  Container,
  Group,
  Paper,
  PasswordInput,
  Radio,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconAlertHexagon, IconInfoHexagon } from '@tabler/icons-react';

const schema = z.object({
  name: z.string().min(1, 'The full name is required'),
  role: z.enum(['ADMIN', 'USER']),
  password: z.union([z.string().min(6, 'The password must be at least 6 characters long'), z.literal('')]),
});

async function getUserByStringId(uid: string) {
  const id = Number(uid);
  if (Number.isNaN(id)) throw data('Invalid user ID', { status: 400 });
  const user = await getUserById(id);
  if (!user) throw data('User not found', { status: 404 });
  return { id, user };
}

export async function loader({ request, params: { uid } }: Route.LoaderArgs) {
  await requireAuth(request, { admin: true });
  const { user } = await getUserByStringId(uid);
  return { user };
}

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  await requireAuth(request, { admin: true });
  const { id } = await getUserByStringId(uid);
  const result = await parseFormData(request, schema);
  if (result.error) return validationError(result.error, result.submittedData);
  await updateUser(id, result.data);
  return null;
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

              {form.formState.submitStatus === 'success' && (
                <Alert title="User Updated" color="green" icon={<IconInfoHexagon />}>
                  The user have been updated successfully.
                </Alert>
              )}
              {form.formState.submitStatus === 'error' && (
                <Alert title="Error Updating User" color="red" icon={<IconAlertHexagon />}>
                  There was an error updating the user. Please check the form for errors.
                </Alert>
              )}
            </Stack>
          )}
        </ValidatedForm>
      </Paper>
    </Container>
  );
}
