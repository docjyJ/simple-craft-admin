import { PrismaClient } from '~/generated/prisma/client';
import { createCookieSessionStorage, type SessionStorage } from 'react-router';
import type { ChildProcess } from 'node:child_process';

let serverProcesses: Map<string, ChildProcess>;
if (!global.__MC_PROCESS__) {
  global.__MC_PROCESS__ = new Map();
}
serverProcesses = global.__MC_PROCESS__;

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
      maxAge: 60,
      path: '/',
      sameSite: 'lax',
      secure: true,
    },
  });
}

sessionStore = global.__SESSION_STORE__;

export { serverProcesses, prisma, sessionStore };
