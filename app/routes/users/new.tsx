import { redirect } from 'react-router';
import type { Route } from './+types/new';
import { z } from 'zod';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { createNewUser, requireAuth } from '~/utils.server/session';
import { Button, Container, Paper, PasswordInput, Radio, Stack, TextInput, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
const schema = z.object({
  username: z.string().min(
    1,
    t(($) => $.users.new.usernameRequired),
  ),
  name: z.string().min(
    1,
    t(($) => $.users.new.nameRequired),
  ),
  password: z.string().min(
    6,
    t(($) => $.users.new.passwordLength),
  ),
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
      if (e?.code == 'P2002') {
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
                error={form.error('username')}
                {...form.getInputProps('username')}
              />
              <TextInput
                label={t(($) => $.users.new.name)}
                placeholder={t(($) => $.users.new.namePlaceholder)}
                required
                error={form.error('name')}
                {...form.getInputProps('name')}
              />
              <PasswordInput
                label={t(($) => $.users.new.password)}
                required
                error={form.error('password')}
                {...form.getInputProps('password')}
              />
              <Radio
                {...form.getInputProps('role', { type: 'radio', value: 'USER' })}
                error={form.error('role')}
                label={t(($) => $.users.new.roleUser)}
              />
              <Radio
                {...form.getInputProps('role', { type: 'radio', value: 'ADMIN' })}
                error={form.error('role')}
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
