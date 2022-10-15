import { PrismaService } from 'src/prisma/prisma.service';

export async function clearDatabase(
  prisma: PrismaService,
  schema = 'public',
): Promise<void> {
  const tableNames = await prisma.$queryRaw<
    {
      tablename: string;
    }[]
  >`SELECT tablename FROM pg_tables WHERE schemaname=${schema};`;

  tableNames.forEach(async ({ tablename }) => {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "${schema}"."${tablename}" CASCADE;`,
        );
      } catch (error) {
        console.error(error);
      }
    }
  });
}
