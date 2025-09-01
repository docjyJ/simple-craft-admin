import { createCookie } from 'react-router';

export const themeCookie = createCookie('theme', {
  path: '/',
  sameSite: 'lax',
  httpOnly: false,
  secure: false,
  maxAge: 60 * 60 * 24 * 365 * 10,
});

function parseTheme(theme: any) {
  if (theme === 'auto') return 'auto';
  if (theme === 'light') return 'light';
  if (theme === 'dark') return 'dark';
  return null;
}

export async function commitTheme(value: 'light' | 'dark' | 'auto') {
  return themeCookie.serialize(value);
}

export async function getTheme(request: Request) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const stored = cookieHeader ? await themeCookie.parse(cookieHeader).then(parseTheme) : null;
  if (stored) return stored;
  return 'auto';
}
