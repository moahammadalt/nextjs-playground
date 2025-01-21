import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
config({ path: '.env.local' });

// For migrations and seeding, we want a connection that ends
const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
export const migrationDb = drizzle(migrationClient);

// For query purposes (normal operation), we want a connection pool
const queryClient = postgres(process.env.DATABASE_URL!);
export const db = drizzle(queryClient, { schema });