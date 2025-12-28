import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit configuration for Turso database
 * Used for migrations and schema management
 *
 * Commands:
 * - pnpm db:generate - Generate SQL migrations from schema changes
 * - pnpm db:migrate  - Apply pending migrations
 * - pnpm db:push     - Push schema changes directly (dev only)
 * - pnpm db:studio   - Open Drizzle Studio for database inspection
 */
export default defineConfig({
  schema: './src/lib/database/schemas/index.ts',
  out: './src/lib/database/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.VITE_TURSO_DATABASE_URL!,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN,
  },
});
