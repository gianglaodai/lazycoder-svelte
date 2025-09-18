import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = neon(env.DATABASE_URL);

// Default database instance (non-transactional)
export const db = drizzle(client, { schema });

// Transaction context for tracking active transactions
const transactionContext = {
  current: null as any
};

/**
 * Gets the current database instance, which could be a transaction
 * if called within a transaction context, or the default db instance otherwise.
 * 
 * @returns The current database instance
 */
export function getCurrentDb(): typeof db {
  return transactionContext.current || db;
}

/**
 * Executes a callback function within a database transaction.
 * 
 * @param callback Function to execute within the transaction
 * @returns The result of the callback function
 * @throws Any error that occurs during the transaction (which will cause automatic rollback)
 */
export async function withTransaction<T>(callback: (tx: typeof db) => Promise<T>): Promise<T> {
  // If already in a transaction, reuse it
  if (transactionContext.current) {
    return callback(transactionContext.current);
  }

  // Otherwise, create a new transaction
  // We need to use a different approach due to TypeScript limitations with the Neon client
  // This is a workaround to make TypeScript happy
  const sql = client as any;
  
  // Store the result outside the transaction
  let result: T;
  
  // Execute the transaction
  await sql.transaction((txClient: any) => {
    // Create a Drizzle instance with the transaction client
    const txDb = drizzle(txClient, { schema });
    
    // Set the current transaction
    const previousTx = transactionContext.current;
    transactionContext.current = txDb;
    
    try {
      // Execute the callback and store the result
      return callback(txDb).then((r: T) => {
        result = r;
        // Return an empty array to satisfy the Neon transaction API
        return [];
      });
    } finally {
      // Restore the previous transaction context
      transactionContext.current = previousTx;
    }
  });
  
  // Return the result
  return result!;
}
