// Export Prisma Client and types
export * from '@prisma/client';
export { PrismaClient } from '@prisma/client';

import { PrismaClient } from '@prisma/client';

// Singleton pattern for PrismaClient to avoid too many connections in development
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
