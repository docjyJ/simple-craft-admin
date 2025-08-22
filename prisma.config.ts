import type { PrismaConfig } from 'prisma';

export default {
  migrations: {
    seed: `tsx db/seed.ts`,
  },
} satisfies PrismaConfig;
