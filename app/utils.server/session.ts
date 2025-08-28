import { hash, verify } from 'argon2';
import { prisma, sessionStore } from '~/utils.server/global';
import { data, redirect } from 'react-router';

export async function getUserId(request: Request) {
  const session = await sessionStore.getSession(request.headers.get('Cookie'));
  return session.get('userId') || null;
}

export async function getUser(request: Request) {
  return getUserId(request).then((id) =>
    id !== null
      ? prisma.user.findUnique({
          select: { username: true, name: true, role: true },
          where: { id },
        })
      : null,
  );
}

export async function loginUser(request: Request, username: string, plainPassword: string) {
  const user = await prisma.user.findUnique({
    select: { id: true, password: true },
    where: { username },
  });
  if (!user) return null;

  const valid = await verify(user.password, plainPassword);
  if (!valid) return null;

  const session = await sessionStore.getSession(request.headers.get('Cookie'));
  session.set('userId', user.id);
  return sessionStore.commitSession(session).then((cookie) => ({ cookie }));
}

export async function logoutUser(request: Request) {
  const session = await sessionStore.getSession(request.headers.get('Cookie'));
  return sessionStore.destroySession(session).then((cookie) => ({ cookie }));
}

export function getUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
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

export function getUserById(id: number) {
  return prisma.user.findUnique({ select: { id: true, username: true, name: true, role: true }, where: { id } });
}

export async function updateUser(id: number, data: { name: string; role: 'ADMIN' | 'USER'; password?: string | null }) {
  const { password, ...rest } = data;
  if (password && password.length > 0) {
    const hashed = await hash(password);
    return prisma.user.update({ where: { id }, data: { ...rest, password: hashed } });
  }
  return prisma.user.update({ where: { id }, data: rest });
}

export async function deleteUser(id: number) {
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

export async function getUserByStringId(uid: string) {
  const id = Number(uid);
  if (Number.isNaN(id)) throw data('Invalid user ID', { status: 400 });
  const user = await getUserById(id);
  if (!user) throw data('User not found', { status: 404 });
  return { id, user };
}
