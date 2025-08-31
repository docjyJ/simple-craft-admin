import { createTheme, DEFAULT_THEME, MantineProvider, type MantineProviderProps } from '@mantine/core';

export const appTheme = createTheme({
  colors: {
    brand: DEFAULT_THEME.colors.blue,
  },
  primaryColor: 'brand',
});

export function AppTheme({
  children,
  theme = appTheme,
  colorChoice = 'auto',
  ...props
}: MantineProviderProps & { colorChoice?: 'light' | 'dark' | 'auto' }) {
  const forceColorScheme = colorChoice === 'auto' ? undefined : colorChoice;
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto" forceColorScheme={forceColorScheme} {...props}>
      {children}
    </MantineProvider>
  );
}
