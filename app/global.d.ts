import PrismaClient from '~/generated/prisma/client';
import type { ChildProcess } from 'node:child_process';

declare global {
  var __PRISMA__: PrismaClient;
  var __MC_PROCESS__: Map<string, ChildProcess>;
}
