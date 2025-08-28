import { redirect } from 'react-router';
import type { Route } from './+types/login';
import { Button, Container, Paper, Stack, TextInput, Title } from '@mantine/core';
import { z } from 'zod';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { getUser, loginUser } from '~/utils.server/session';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  if (user) return redirect('/servers');
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const url = new URL(request.url);
  const redirectParam = url.searchParams.get('redirect') ?? '/';
  const result = await parseFormData(request, schema);
  if (result.error) {
    return validationError(result.error, result.submittedData);
  }
  const login = await loginUser(request, result.data.username, result.data.password);
  if (!login) {
    return validationError(
      {
        formId: result.formId,
        fieldErrors: {
          username: 'Invalid username or password',
          password: 'Invalid username or password',
        },
      },
      result.submittedData,
    );
  }
  return redirect(redirectParam, {
    headers: {
      'Set-Cookie': login.cookie,
    },
  });
}

export default function Login() {
  return (
    <Container size={420} my={40}>
      <Title ta="center" mb="md">
        Login
      </Title>
      <Paper withBorder shadow="sm" p="lg" radius="md">
        <ValidatedForm method="post" schema={schema} defaultValues={{ username: '', password: '' }}>
          {(form) => (
            <Stack>
              <TextInput
                name="username"
                label="Username"
                placeholder="admin"
                required
                error={form.error('username')}
                {...form.getInputProps('username')}
              />
              <TextInput
                name="password"
                label="Password"
                type="password"
                required
                error={form.error('password')}
                {...form.getInputProps('password')}
              />
              <Button type="submit" loading={form.formState.isSubmitting}>
                Log In
              </Button>
            </Stack>
          )}
        </ValidatedForm>
      </Paper>
    </Container>
  );
}
