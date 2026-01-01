import { Button, Container, Paper, Select, Stack, Title } from '@mantine/core';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { useTranslation } from 'react-i18next';
import { redirect } from 'react-router';
import { z } from 'zod';
import { commitLocale, getLocale } from '~/utils.server/locale';
import { requireAuth } from '~/utils.server/session';
import { commitTheme, getTheme } from '~/utils.server/theme';
import type { Route } from './+types/settings';

const schema = z.object({
  theme: z.enum(['light', 'dark', 'auto']),
  locale: z.enum(['en', 'fr']),
});

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const [theme, locale] = await Promise.all([getTheme(request), getLocale(request)]);
  return { theme, locale };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const result = await parseFormData(request, schema);
  if (result.error) {
    return validationError(result.error, result.submittedData);
  }
  const themeCookie = await commitTheme(result.data.theme);
  const localeCookie = await commitLocale(result.data.locale);
  const headers = new Headers();
  headers.append('Set-Cookie', themeCookie);
  headers.append('Set-Cookie', localeCookie);
  return redirect('/settings', { headers });
}

export default function Settings({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation();
  return (
    <Container size={520} my={40}>
      <Title order={2} mb="md">
        {t(($) => $.settings.title)}
      </Title>
      <Paper withBorder p="lg" radius="md">
        <ValidatedForm
          method="post"
          schema={schema}
          defaultValues={{ theme: loaderData.theme, locale: loaderData.locale }}
        >
          {(form) => {
            const { value: themeValue, ...themeInputProps } = form.getInputProps('theme');
            const cleanThemeValue =
              typeof themeValue === 'number'
                ? themeValue.toString()
                : typeof themeValue === 'object'
                  ? undefined
                  : themeValue;
            const cleanThemeInputProps = { value: cleanThemeValue, ...themeInputProps };
            const { value: localeValue, ...localeInputProps } = form.getInputProps('locale');
            const cleanLocaleValue =
              typeof localeValue === 'number'
                ? localeValue.toString()
                : typeof localeValue === 'object'
                  ? undefined
                  : localeValue;
            const cleanLocaleInputProps = { value: cleanLocaleValue, ...localeInputProps };
            return (
              <Stack>
                <Select
                  label={t(($) => $.settings.theme)}
                  data={[
                    { value: 'light', label: t(($) => $.settings.themeOptions.light) },
                    { value: 'dark', label: t(($) => $.settings.themeOptions.dark) },
                    { value: 'auto', label: t(($) => $.settings.themeOptions.auto) },
                  ]}
                  {...cleanThemeInputProps}
                />
                <Select
                  label={t(($) => $.settings.language)}
                  data={[
                    { value: 'en', label: 'English' },
                    { value: 'fr', label: 'Français' },
                  ]}
                  {...cleanLocaleInputProps}
                />
                <Button type="submit" loading={form.formState.isSubmitting}>
                  {t(($) => $.settings.save)}
                </Button>
              </Stack>
            );
          }}
        </ValidatedForm>
      </Paper>
    </Container>
  );
}
