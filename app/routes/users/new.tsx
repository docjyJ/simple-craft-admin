import { redirect } from 'react-router';
import type { Route } from './+types/new';
import { z } from 'zod';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { createNewUser, getUser, getUserByUsername } from '~/server/session';
import {
  Button,
  Container,
  Paper,
  PasswordInput,
  Radio,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';

const schema = z.object({
  username: z.string().min(1, 'The username is required'),
  name: z.string().min(1, 'The full name is required'),
  password: z.string().min(6, 'The password must be at least 6 characters long'),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
});

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  if (!user) return redirect('/login');
  if (user.role !== 'ADMIN') return redirect('/servers');
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const current = await getUser(request);
  if (!current) return redirect('/login');
  if (current.role !== 'ADMIN') return redirect('/servers');

  const result = await parseFormData(request, schema);
  if (result.error) return validationError(result.error, result.submittedData);

  const existing = await getUserByUsername(result.data.username);
  if (existing !== null) {
    return validationError(
      {
        formId: result.formId,
        fieldErrors: { username: 'This username is already taken' },
      },
      result.submittedData,
    );
  }
  return createNewUser(result.data).then(() => redirect('/servers'));
}

export default function NewUser() {
  return (
    <Container size={520} my={40}>
      <Title ta="center" mb="md">
        Create a new user
      </Title>
      <Paper withBorder shadow="sm" p="lg" radius="md">
        <ValidatedForm
          method="post"
          schema={schema}
          defaultValues={{ username: '', name: '', password: '', role: 'USER' }}
        >
          {(form) => (
            <Stack>
              <TextInput
                name="username"
                label="Username"
                placeholder="jdupont"
                required
                error={form.error('username')}
                {...form.getInputProps('username')}
              />
              <TextInput
                label="Full name"
                placeholder="Jean Dupont"
                required
                error={form.error('name')}
                {...form.getInputProps('name')}
              />
              <PasswordInput
                label="Mot de passe"
                required
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
              <Button type="submit" loading={form.formState.isSubmitting}>
                Créer
              </Button>
            </Stack>
          )}
        </ValidatedForm>
      </Paper>
    </Container>
  );
}
