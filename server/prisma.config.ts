import { defineConfig } from 'prisma/config';
import 'dotenv/config';

// Prisma 7.x: connection URL must be defined here, not in schema.prisma
export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  migrate: {
    adapter: async () => {
      // For Prisma Migrate we use the pg adapter at runtime
      // The DATABASE_URL env var drives the connection
      const { PrismaPg } = await import('@prisma/adapter-pg');
      const { default: pg } = await import('pg');
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set.');
      }
      const pool = new pg.Pool({ connectionString });
      return new PrismaPg(pool);
    },
  },
});
