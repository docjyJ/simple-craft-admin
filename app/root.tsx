import React from 'react';
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from 'react-router';
import { Box, Code, ColorSchemeScript, Container, mantineHtmlProps, Text, Title } from '@mantine/core';
import type { Route } from './+types/root';
import './app.css';
import { AppTheme } from '~/app-theme';
import { getTheme } from '~/utils.server/theme';
import { getLocale } from '~/utils.server/locale';
import './i18n';
import { useTranslation } from 'react-i18next';

export async function loader({ request }: Route.LoaderArgs) {
  const [theme, locale] = await Promise.all([getTheme(request), getLocale(request)]);
  return { theme, locale };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();
  return (
    <html lang={data?.locale || 'en'} {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <ColorSchemeScript />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData: { theme, locale } }: Route.ComponentProps) {
  const { i18n } = useTranslation();
  if (locale && i18n.language !== locale) {
    // Ressources déjà chargées inline, changement synchro suffisant pour SSR
    i18n.changeLanguage(locale).catch(() => {});
  }
  // useEffect garde une mise à jour client si nécessaire
  React.useEffect(() => {
    if (locale && i18n.language !== locale) {
      i18n.changeLanguage(locale).catch(() => {});
    }
  }, [locale, i18n]);
  return (
    <AppTheme colorChoice={theme}>
      <Outlet />
    </AppTheme>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { t } = useTranslation();
  let message = t(($) => $.error.oops) as string;
  let details = t(($) => $.error.unexpected) as string;
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? t(($) => $.error[404]) : t(($) => $.error.generic);
    details = error.status === 404 ? t(($) => $.error.notfound) : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <Container component="main" pt="xl" p="md" mx="auto">
      <Title>{message}</Title>
      <Text>{details}</Text>
      {stack && (
        <Box component="pre" w="100%" style={{ overflowX: 'auto' }} p="md">
          <Code>{stack}</Code>
        </Box>
      )}
    </Container>
  );
}
