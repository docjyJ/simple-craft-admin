import { PrismaClient } from '~/generated/prisma/client';
import type { ServerMinecraft } from '~/utils.server/server-minecraft';

let serverMinecraftInstances: Map<string, ServerMinecraft>;
if (!global.__MC_INSTANCE__) {
  const map = new Map<string, ServerMinecraft>();
  global.__MC_INSTANCE__ = map;
  serverMinecraftInstances = map;
} else {
  serverMinecraftInstances = global.__MC_INSTANCE__;
}

let prisma: PrismaClient;
if (!global.__PRISMA__) {
  const client = new PrismaClient();
  global.__PRISMA__ = client;
  prisma = client;
} else {
  prisma = global.__PRISMA__;
}

export { prisma, serverMinecraftInstances };
