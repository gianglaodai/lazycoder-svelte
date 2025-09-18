import type { TransactionManager } from '$lib/server/service/transaction';
import { withTransaction as dbWithTransaction } from './index';

/**
 * Drizzle implementation of the TransactionManager interface.
 * This connects the abstract transaction interface from the service layer
 * to the concrete implementation in the database layer.
 */
export class DrizzleTransactionManager implements TransactionManager {
	async withTransaction<T>(callback: (context: unknown) => Promise<T>): Promise<T> {
		return dbWithTransaction(async (tx) => {
			return callback(tx);
		});
	}
}

// Create a singleton instance
export const drizzleTransactionManager = new DrizzleTransactionManager();
