import { PrismaClient } from '~/generated/prisma/client';
import { hash } from 'argon2';

async function main() {
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { username: 'admin' } });
    if (!existing) {
      const password = await hash('admin');
      await prisma.user.create({
        data: { username: 'admin', name: 'Administrator', password, role: 'ADMIN' },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
