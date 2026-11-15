import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

let prismaClient: PrismaClient | null = null;

/**
 * Lazily-initialised Prisma client singleton.
 *
 * The client is created on first use so that modules which only need types or
 * which run without a database (e.g. unit tests with fakes) do not require
 * DATABASE_URL at import time.
 */
export function getPrisma(): PrismaClient {
  if (prismaClient) return prismaClient;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured. Cannot initialise the Prisma client.');
  }

  const adapter = new PrismaPg({ connectionString });
  prismaClient = new PrismaClient({ adapter });
  return prismaClient;
}

/** Disconnect and clear the cached client. Intended for tests and shutdown. */
export async function disconnectPrisma(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
  }
}
