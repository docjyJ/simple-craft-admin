import type PrismaClient from '~/generated/prisma/client';
import type { SessionStorage } from 'react-router';
import type { ServerMinecraft } from '~/utils.server/server-minecraft';

declare global {
  var __PRISMA__: PrismaClient;
  var __MC_INSTANCE__: Map<string, ServerMinecraft>; // instances serveurs
  var __SESSION_STORE__: SessionStorage<{ userId: number }>;
}
