import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create the postgres client with better connection handling
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  onnotice: () => {}, // Suppress notices
  transform: {
    undefined: null
  }
});

// Create the drizzle database instance
export const db = drizzle(client, { schema });

// Test the connection and handle errors gracefully
export async function testConnection() {
  try {
    await client`SELECT 1`;
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}