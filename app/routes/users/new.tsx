import { Button, Container, Paper, PasswordInput, Radio, Stack, TextInput, Title } from '@mantine/core';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { useTranslation } from 'react-i18next';
import { redirect } from 'react-router';
import { z } from 'zod';
import { createNewUser, requireAuth } from '~/utils.server/session';
import type { Route } from './+types/new';

const schema = z.object({
  username: z.string().min(1, 'users.new.usernameRequired'),
  name: z.string().min(1, 'users.new.nameRequired'),
  password: z.string().min(6, 'users.new.passwordLength'),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
});

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, { admin: true });
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request, { admin: true });
  const result = await parseFormData(request, schema);
  if (result.error) return validationError(result.error, result.submittedData);
  return createNewUser(result.data)
    .then(({ id }) => redirect(`/users/${id}/edit`))
    .catch((e) => {
      if (e?.code === 'P2002') {
        return validationError(
          {
            formId: result.formId,
            fieldErrors: { username: 'This username is already taken' },
          },
          result.submittedData,
        );
      }
      throw e;
    });
}

export default function NewUser() {
  const { t } = useTranslation();
  const parseError = (error: string | null) => {
    if (error === 'users.new.usernameRequired') return t(($) => $.users.new.usernameRequired);
    if (error === 'users.new.nameRequired') return t(($) => $.users.new.nameRequired);
    if (error === 'users.new.passwordLength') return t(($) => $.users.new.passwordLength);
    return error;
  };
  return (
    <Container size={520} my={40}>
      <Title ta="center" mb="md">
        {t(($) => $.users.new.title)}
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
                label={t(($) => $.users.new.username)}
                placeholder={t(($) => $.users.new.usernamePlaceholder)}
                required
                error={parseError(form.error('username'))}
                {...form.getInputProps('username')}
              />
              <TextInput
                label={t(($) => $.users.new.name)}
                placeholder={t(($) => $.users.new.namePlaceholder)}
                required
                error={parseError(form.error('name'))}
                {...form.getInputProps('name')}
              />
              <PasswordInput
                label={t(($) => $.users.new.password)}
                required
                error={parseError(form.error('password'))}
                {...form.getInputProps('password')}
              />
              <Radio
                {...form.getInputProps('role', { type: 'radio', value: 'USER' })}
                error={parseError(form.error('role'))}
                label={t(($) => $.users.new.roleUser)}
              />
              <Radio
                {...form.getInputProps('role', { type: 'radio', value: 'ADMIN' })}
                error={parseError(form.error('role'))}
                label={t(($) => $.users.new.roleAdmin)}
              />
              <Button type="submit" loading={form.formState.isSubmitting}>
                {t(($) => $.users.new.create)}
              </Button>
            </Stack>
          )}
        </ValidatedForm>
      </Paper>
    </Container>
  );
}
