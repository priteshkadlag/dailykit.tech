import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set. See .env.example.");
  // DATABASE_POOL_MAX=1 is needed for `prisma dev` (embedded Postgres can't interleave connections);
  // leave it unset for a real PostgreSQL server.
  const max = Number(process.env.DATABASE_POOL_MAX) || undefined;
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, max }) });
}

// One client per process, reused across hot reloads in development. After `prisma generate` the
// PrismaClient class itself changes, so a cached client from the old class is replaced — otherwise new
// models stay undefined until the dev server restarts.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaClass?: typeof PrismaClient };

function client() {
  if (!globalForPrisma.prisma || globalForPrisma.prismaClass !== PrismaClient) {
    void globalForPrisma.prisma?.$disconnect();
    globalForPrisma.prisma = createClient();
    globalForPrisma.prismaClass = PrismaClient;
  }
  return globalForPrisma.prisma;
}

/**
 * Created on first use rather than on import, so building the app (which imports every route)
 * doesn't need a database connection string.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_, property) {
    const target = client();
    const value = Reflect.get(target, property, target);
    return typeof value === "function" ? value.bind(target) : value;
  },
});
