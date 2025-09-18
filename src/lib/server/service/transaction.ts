import { drizzleTransactionManager } from '$lib/server/db/transaction';

/**
 * Transaction manager interface for the service layer.
 * This provides an abstraction for transaction management,
 * allowing the service layer to remain independent of the database implementation.
 */
export interface TransactionManager {
	withTransaction<T>(callback: (context: unknown) => Promise<T>): Promise<T>;
}

/**
 * Factory function for creating the Transactional decorator.
 * This allows the service layer to use transactions without directly depending on the database implementation.
 *
 * @param transactionManager The transaction manager implementation
 * @returns A decorator function that wraps methods in transactions
 */
export function createTransactionalDecorator(transactionManager: TransactionManager) {
	return function Transactional(
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor
	): PropertyDescriptor {
		const originalMethod = descriptor.value;

		descriptor.value = async function (...args: any[]) {
			return transactionManager.withTransaction(async () => {
				return originalMethod.apply(this, args);
			});
		};

		return descriptor;
	};
}

export const Transactional = createTransactionalDecorator(drizzleTransactionManager);
