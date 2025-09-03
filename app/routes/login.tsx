import { redirect } from 'react-router';
import type { Route } from './+types/login';
import { Button, Container, Paper, Stack, TextInput, Title } from '@mantine/core';
import { z } from 'zod';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { getUser, loginUser } from '~/utils.server/session';
import { useTranslation } from 'react-i18next';

const schema = z.object({
  username: z.string().min(1, 'login.error.required.username'),
  password: z.string().min(1, 'login.error.required.password'),
});

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  if (user) return redirect('/dashboard');
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const url = new URL(request.url);
  const redirectParam = url.searchParams.get('redirect') || '/dashboard';
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
          username: 'login.error.invalid',
          password: 'login.error.invalid',
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
  const { t } = useTranslation();
  const parseError = (error: string | null) => {
    if (error === 'login.error.invalid') return t(($) => $.login.error.invalid);
    if (error === 'login.error.required.username') return t(($) => $.login.error.required.username);
    if (error === 'login.error.required.password') return t(($) => $.login.error.required.password);
    return error;
  };
  return (
    <Container size={420} my={40}>
      <Title ta="center" mb="md">
        {t(($) => $.login.title)}
      </Title>
      <Paper withBorder shadow="sm" p="lg" radius="md">
        <ValidatedForm method="post" schema={schema} defaultValues={{ username: '', password: '' }}>
          {(form) => (
            <Stack>
              <TextInput
                name="username"
                label={t(($) => $.login.username)}
                placeholder="admin"
                required
                error={parseError(form.error('username'))}
                {...form.getInputProps('username')}
              />
              <TextInput
                name="password"
                label={t(($) => $.login.password)}
                type="password"
                required
                error={parseError(form.error('password'))}
                {...form.getInputProps('password')}
              />
              <Button type="submit" loading={form.formState.isSubmitting}>
                {t(($) => $.login.submit)}
              </Button>
            </Stack>
          )}
        </ValidatedForm>
      </Paper>
    </Container>
  );
}
