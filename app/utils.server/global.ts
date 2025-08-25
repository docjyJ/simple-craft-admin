import { PrismaClient } from '~/generated/prisma/client';
import { createCookieSessionStorage, type SessionStorage } from 'react-router';
import type { ServerMinecraft } from '~/utils.server/server-minecraft';

let serverMinecraftInstances: Map<string, ServerMinecraft>;
if (!global.__MC_INSTANCE__) {
  global.__MC_INSTANCE__ = new Map();
}
serverMinecraftInstances = global.__MC_INSTANCE__;

let prisma: PrismaClient;
if (!global.__PRISMA__) {
  global.__PRISMA__ = new PrismaClient();
}
prisma = global.__PRISMA__;

let sessionStore: SessionStorage<{ userId: number }>;
if (!global.__SESSION_STORE__) {
  global.__SESSION_STORE__ = createCookieSessionStorage({
    cookie: {
      name: '__session',
      httpOnly: true,
      maxAge: 3600,
      path: '/',
      sameSite: 'strict',
      secrets: ['ecd0da9f-0133-4a0f-84c9-aca66208a78b'],
      secure: true,
    },
  });
}

sessionStore = global.__SESSION_STORE__;

export { prisma, sessionStore, serverMinecraftInstances };
