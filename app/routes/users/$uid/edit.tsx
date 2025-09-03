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
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
const schema = z.object({
  name: z.string().min(
    1,
    t(($) => $.users.edit.nameRequired),
  ),
  role: z.enum(['ADMIN', 'USER']),
  password: z.union([
    z.string().min(
      6,
      t(($) => $.users.edit.passwordLength),
    ),
    z.literal(''),
  ]),
});

export async function loader({ request, params: { uid } }: Route.LoaderArgs) {
  await requireAuth(request, { admin: true });
  const user = await getUserById(uid);
  if (!user) throw data('User not found', { status: 404 });
  return { user };
}

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  await requireAuth(request, { admin: true });
  const user = await getUserById(uid);
  if (!user) throw data('User not found', { status: 404 });
  const result = await parseFormData(request, schema);
  if (result.error) return validationError(result.error, result.submittedData);
  await updateUser(user.id, result.data);
  return null;
}

export default function EditUser({ loaderData: { user } }: Route.ComponentProps) {
  const { t } = useTranslation();
  return (
    <Container size={520} my={40}>
      <Title ta="center" mb="md">
        {t(($) => $.users.edit.title)}
      </Title>
      <Paper withBorder shadow="sm" p="lg" radius="md">
        <ValidatedForm method="post" schema={schema} defaultValues={{ name: user.name, role: user.role, password: '' }}>
          {(form) => (
            <Stack>
              <Text fw={500}>
                {t(($) => $.users.edit.username)}: {user.username}
              </Text>
              <TextInput
                name="name"
                label={t(($) => $.users.edit.name)}
                required
                error={form.error('name')}
                {...form.getInputProps('name')}
              />
              <PasswordInput
                name="password"
                label={t(($) => $.users.edit.passwordLabel)}
                error={form.error('password')}
                {...form.getInputProps('password')}
              />
              <Radio
                {...form.getInputProps('role', { type: 'radio', value: 'USER' })}
                error={form.error('role')}
                label={t(($) => $.users.edit.roleUser)}
              />
              <Radio
                {...form.getInputProps('role', { type: 'radio', value: 'ADMIN' })}
                error={form.error('role')}
                label={t(($) => $.users.edit.roleAdmin)}
              />
              <Group justify="flex-end">
                <Button variant="outline" component={Link} to="/users" disabled={form.formState.isSubmitting}>
                  {t(($) => $.users.edit.cancel)}
                </Button>
                <Button type="submit" loading={form.formState.isSubmitting}>
                  {t(($) => $.users.edit.save)}
                </Button>
              </Group>
              {form.formState.submitStatus === 'success' && (
                <Alert title={t(($) => $.users.edit.successTitle)} color="green" icon={<IconInfoHexagon />}>
                  {t(($) => $.users.edit.successMsg)}
                </Alert>
              )}
              {form.formState.submitStatus === 'error' && (
                <Alert title={t(($) => $.users.edit.errorTitle)} color="red" icon={<IconAlertHexagon />}>
                  {t(($) => $.users.edit.errorMsg)}
                </Alert>
              )}
            </Stack>
          )}
        </ValidatedForm>
      </Paper>
    </Container>
  );
}
