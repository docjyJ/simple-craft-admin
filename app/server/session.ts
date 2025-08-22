import { createCookieSessionStorage } from 'react-router';
import { verify } from 'argon2';
import { PrismaClient } from '~/generated/prisma/client';

let prisma: PrismaClient;

if (!global.__PRISMA__) {
  global.__PRISMA__ = new PrismaClient();
}
prisma = global.__PRISMA__;

const { getSession, commitSession, destroySession } = createCookieSessionStorage<{
  userId: number;
}>({
  cookie: {
    name: '__session',
    httpOnly: true,
    maxAge: 60,
    path: '/',
    sameSite: 'lax',
    secure: true,
  },
});

export async function getUserId(request: Request) {
  const session = await getSession(request.headers.get('Cookie'));
  return session.get('userId') || null;
}

export async function getUser(request: Request) {
  return getUserId(request).then((id) =>
    id !== null
      ? prisma.user.findUnique({ select: { pseudo: true, name: true }, where: { id } })
      : null,
  );
}

export async function loginUser(request: Request, pseudo: string, plainPassword: string) {
  const user = await prisma.user.findUnique({
    select: { id: true, password: true },
    where: { pseudo },
  });
  if (!user) return null;

  const valid = await verify(user.password, plainPassword);
  if (!valid) return null;

  const session = await getSession(request.headers.get('Cookie'));
  session.set('userId', user.id);
  return commitSession(session).then((cookie) => ({ cookie }));
}

export async function logoutUser(request: Request) {
  const session = await getSession(request.headers.get('Cookie'));
  return destroySession(session).then((cookie) => ({ cookie }));
}
