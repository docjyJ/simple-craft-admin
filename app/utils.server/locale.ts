import { createCookie } from 'react-router';

export const localeCookie = createCookie('locale', {
  path: '/',
  sameSite: 'lax',
  httpOnly: false,
  secure: false,
  maxAge: 60 * 60 * 24 * 365 * 5,
});

function parseLang(locale: any) {
  if (locale === 'en') return 'en';
  if (locale === 'fr') return 'fr';
  return null;
}

export async function commitLocale(locale: 'en' | 'fr') {
  return localeCookie.serialize(locale);
}

export async function getLocale(request: Request) {
  const cookieHeader = request.headers.get('Cookie');
  const stored = cookieHeader ? await localeCookie.parse(cookieHeader).then(parseLang) : null;
  if (stored) return stored;
  const header = request.headers.get('Accept-Language');
  if (header) {
    for (const l of header.split(',').map((l) => l.trim().split(';')[0])) {
      const base = parseLang(l.toLowerCase().split('-')[0]);
      if (base) return base;
    }
  }
  return 'en';
}
