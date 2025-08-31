import { createCookie } from 'react-router';

export const themeCookie = createCookie('theme', {
  path: '/',
  sameSite: 'lax',
  httpOnly: false,
  secure: false,
  maxAge: 60 * 60 * 24 * 365 * 10,
});

export async function getTheme(request: Request): Promise<'light' | 'dark' | 'auto'> {
  const cookieHeader = request.headers.get('Cookie') || '';
  const stored = cookieHeader ? await themeCookie.parse(cookieHeader) : null;
  if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored;
  return 'auto';
}

export async function commitTheme(value: 'light' | 'dark' | 'auto') {
  return themeCookie.serialize(value);
}
