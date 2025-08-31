import type PrismaClient from '~/generated/prisma/client';
import type { ServerMinecraft } from '~/utils.server/server-minecraft';

declare global {
  var __PRISMA__: PrismaClient;
  var __MC_INSTANCE__: Map<string, ServerMinecraft>;
}
