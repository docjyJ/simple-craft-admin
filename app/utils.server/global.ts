import { PrismaClient } from '~/generated/prisma/client';
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

export { prisma, serverMinecraftInstances };
