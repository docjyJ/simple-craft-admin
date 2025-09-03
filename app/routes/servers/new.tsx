import { redirect } from 'react-router';
import type { Route } from './+types/new';
import { z } from 'zod';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { createMinecraftServer } from '~/utils.server/minecraft-servers';
import { requireAuth } from '~/utils.server/session';
import { Button, Container, Paper, Stack, TextInput, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

const schema = z.object({
  name: z.string().min(1, 'servers.new.nameRequired'),
});

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const result = await parseFormData(request, schema);
  if (result.error) return validationError(result.error, result.submittedData);
  const uid = await createMinecraftServer(result.data);
  return redirect(`/servers/${uid}`);
}

export default function NewServer() {
  const { t } = useTranslation();
  const parseError = (error: string | null) => {
    if (error === 'servers.new.nameRequired') return t(($) => $.servers.new.nameRequired);
    return error;
  };
  return (
    <Container size={520} my={40}>
      <Title ta="center" mb="md">
        {t(($) => $.servers.new.title)}
      </Title>
      <Paper withBorder shadow="sm" p="lg" radius="md">
        <ValidatedForm method="post" schema={schema} defaultValues={{ name: '' }}>
          {(form) => (
            <Stack>
              <TextInput
                name="serverName"
                label={t(($) => $.servers.new.nameLabel)}
                placeholder={t(($) => $.servers.new.namePlaceholder)}
                required
                error={parseError(form.error('name'))}
                {...form.getInputProps('name')}
              />
              <Button type="submit" loading={form.formState.isSubmitting}>
                {t(($) => $.servers.new.create)}
              </Button>
            </Stack>
          )}
        </ValidatedForm>
      </Paper>
    </Container>
  );
}
