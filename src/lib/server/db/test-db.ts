import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Test database connection string
const TEST_DATABASE_URL = 'postgres://postgres:postgres@localhost:5433/lazycoder_test';

// Create a PostgreSQL client for the test database
const testClient = postgres(TEST_DATABASE_URL);

// Create a Drizzle instance with the test client
export const testDb = drizzle(testClient, { schema });

// Function to get the test database instance
export function getTestDb() {
	return testDb;
}

// Function to close the test database connection
export async function closeTestDb() {
	await testClient.end();
}

// Transaction context for tracking active test transactions
const testTransactionContext = {
	current: null as any
};

/**
 * Gets the current test database instance, which could be a transaction
 * if called within a transaction context, or the default testDb instance otherwise.
 *
 * @returns The current test database instance
 */
export function getCurrentTestDb(): typeof testDb {
	return testTransactionContext.current || testDb;
}

/**
 * Executes a callback function within a test database transaction.
 *
 * @param callback Function to execute within the transaction
 * @returns The result of the callback function
 * @throws Any error that occurs during the transaction (which will cause automatic rollback)
 */
export async function withTestTransaction<T>(
	callback: (tx: typeof testDb) => Promise<T>
): Promise<T> {
	// If already in a transaction, reuse it
	if (testTransactionContext.current) {
		return callback(testTransactionContext.current);
	}

	let result: T;

	await testClient.transaction(async (txClient) => {
		// Create a Drizzle instance with the transaction client
		const txDb = drizzle(txClient, { schema });

		// Set the current transaction
		const previousTx = testTransactionContext.current;
		testTransactionContext.current = txDb;

		try {
			// Execute the callback and store the result
			result = await callback(txDb);
		} finally {
			// Restore the previous transaction context
			testTransactionContext.current = previousTx;
		}
	});

	return result!;
}
