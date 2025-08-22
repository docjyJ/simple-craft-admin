import PrismaClient from '~/generated/prisma/client';

declare global {
  var __PRISMA__: PrismaClient;
}
