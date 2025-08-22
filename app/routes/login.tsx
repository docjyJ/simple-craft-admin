import { redirect } from 'react-router';
import type { Route } from './+types/login';
import { Button, Container, Paper, Stack, TextInput, Title } from '@mantine/core';
import { z } from 'zod';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { getUser, loginUser } from '~/server/session';

const schema = z.object({
  pseudo: z.string().min(1, 'Pseudo is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  if (user) return redirect('/servers');
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const result = await parseFormData(request, schema);
  if (result.error) {
    return validationError(result.error, result.submittedData);
  }
  const login = await loginUser(request, result.data.pseudo, result.data.password);
  if (!login) {
    return validationError(
      {
        formId: result.formId,
        fieldErrors: { user: 'Invalid pseudo or password', password: 'Invalid pseudo or password' },
      },
      result.submittedData,
    );
  }
  return redirect('/servers', {
    headers: {
      'Set-Cookie': login.cookie,
    },
  });
}

export default function Login() {
  return (
    <Container size={420} my={40}>
      <Title ta="center" mb="md">
        Connexion
      </Title>
      <Paper withBorder shadow="sm" p="lg" radius="md">
        <ValidatedForm method="post" schema={schema} defaultValues={{ pseudo: '', password: '' }}>
          {(form) => (
            <Stack>
              <TextInput
                name="pseudo"
                label="Pseudo"
                placeholder="admin"
                required
                error={form.error('pseudo')}
                {...form.getInputProps('pseudo')}
              />
              <TextInput
                name="password"
                label="Mot de passe"
                type="password"
                required
                error={form.error('password')}
                {...form.getInputProps('password')}
              />
              <Button type="submit" loading={form.formState.isSubmitting}>
                Se connecter
              </Button>
            </Stack>
          )}
        </ValidatedForm>
      </Paper>
    </Container>
  );
}
