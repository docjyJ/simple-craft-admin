import { hash, verify } from 'argon2';
import { createSessionStorage, data, redirect } from 'react-router';
import { prisma } from '~/utils.server/global';
import type { User as PrismaUser } from '~/generated/prisma/client';

type User = Omit<PrismaUser, 'password'>;

type SessionData = { user: User };

const sessionStore = createSessionStorage<SessionData, {}>({
  cookie: {
    name: '__session',
    httpOnly: true,
    maxAge: 3600,
    path: '/',
    sameSite: 'strict',
    secrets: ['ecd0da9f-0133-4a0f-84c9-aca66208a78b'],
    secure: true,
  },
  createData: createSession,
  readData: getUserBySessionId,
  updateData: updateSession,
  deleteData: deleteSession,
});

async function createSession(data: Partial<SessionData>, expiresAt?: Date) {
  const { id } = await prisma.session.create({
    data: { userId: data.user?.id ?? null, expiresAt },
    select: { id: true },
  });
  return id;
}

cleanSessions();

async function cleanSessions() {
  const now = new Date();
  return prisma.session.deleteMany({ where: { expiresAt: { lt: now } } });
}

ensureAdminUser().then(() => {});

async function ensureAdminUser() {
  const username = 'admin';
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return;
  }
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return;
  const hashed = await hash(password);
  await prisma.user.create({
    data: {
      username,
      name: 'Administrator',
      password: hashed,
      role: 'ADMIN',
    },
  });
}

async function getUserBySessionId(id: string) {
  const now = new Date();
  return prisma.session
    .findUnique({
      where: { id, expiresAt: { gt: now } },
      select: { user: { select: { id: true, username: true, name: true, role: true } } },
    })
    .then((session) => (session === null ? null : { user: session.user || undefined }));
}

async function updateSession(id: string, data: Partial<SessionData>, expiresAt?: Date) {
  await prisma.session.update({
    where: { id },
    data: { userId: data.user?.id ?? null, expiresAt },
  });
}

async function deleteSession(id: string) {
  await prisma.session.delete({ where: { id } });
}

export async function getUser(request: Request) {
  const session = await sessionStore.getSession(request.headers.get('Cookie'));
  return session.get('user') || null;
}

export async function loginUser(request: Request, username: string, plainPassword: string) {
  const data = await prisma.user.findUnique({
    where: { username },
  });
  if (!data) return null;

  const { password, ...user } = data;

  const valid = await verify(password, plainPassword);
  if (!valid) return null;

  const session = await sessionStore.getSession(request.headers.get('Cookie'));
  session.set('user', user);
  return sessionStore.commitSession(session).then((cookie) => ({ cookie }));
}

export async function logoutUser(request: Request) {
  const session = await sessionStore.getSession(request.headers.get('Cookie'));
  return sessionStore.destroySession(session).then((cookie) => ({ cookie }));
}

export async function createNewUser({
  password,
  ...data
}: {
  username: string;
  name: string;
  password: string;
  role: 'ADMIN' | 'USER';
}) {
  return hash(password).then((password) => prisma.user.create({ data: { password, ...data } }));
}

export function listUsers() {
  return prisma.user.findMany({ select: { id: true, username: true, name: true, role: true }, orderBy: { id: 'asc' } });
}

export function getUserById(id: string) {
  return prisma.user.findUnique({ select: { id: true, username: true, name: true, role: true }, where: { id } });
}

export async function updateUser(id: string, data: { name: string; role: 'ADMIN' | 'USER'; password?: string | null }) {
  const { password, ...rest } = data;
  if (password && password.length > 0) {
    const hashed = await hash(password);
    return prisma.user.update({ where: { id }, data: { ...rest, password: hashed } });
  }
  return prisma.user.update({ where: { id }, data: rest });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}

export async function requireAuth(request: Request, permission?: { admin?: boolean }) {
  const user = await getUser(request);
  if (!user) {
    const url = new URL(request.url);
    throw redirect(`/login?redirect=${encodeURIComponent(url.pathname + url.search)}`);
  }
  if (permission?.admin && user.role !== 'ADMIN') {
    throw data('bad right', { status: 403 });
  }
  return user;
}
