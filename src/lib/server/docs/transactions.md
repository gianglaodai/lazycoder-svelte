# Transaction Support in the Application

This document explains how to use transactions in the application to ensure data consistency across multiple database operations.

## Overview

Transactions ensure that a series of database operations either all succeed or all fail together. This is crucial for maintaining data integrity in operations that span multiple entities or tables.

Our implementation uses Neon's transaction support with Drizzle ORM and follows a repository pattern with service layers.

## Implementation Details

### Database Layer

The transaction support is implemented in `src/lib/server/db/index.ts`:

```typescript
export async function withTransaction<T>(callback: (tx: typeof db) => Promise<T>): Promise<T> {
	return client.transaction(async (txClient) => {
		const txDb = drizzle(txClient, { schema });
		return callback(txDb);
	});
}
```

This function creates a transaction context and passes a transactional database instance to the callback function.

### Repository Layer

The `BaseDrizzleRepository` class includes a `withTransaction` method:

```typescript
async withTransaction<R>(
  txDb: any,
  operation: (repo: BaseDrizzleRepository<T, C>) => Promise<R>
): Promise<R> {
  const txRepo = new BaseDrizzleRepository<T, C>({
    ...this,
    db: txDb
  });

  return operation(txRepo);
}
```

This method creates a new repository instance that uses the transaction database connection.

### Service Layer

The `BaseService` class includes a `withTransaction` method:

```typescript
async withTransaction<R>(
  operation: (service: BaseService<T, C>) => Promise<R>
): Promise<R> {
  return withTransaction(async (txDb) => {
    const txRepo = await this.repo.withTransaction(txDb, (r) => Promise.resolve(r));
    const txService = new BaseService<T, C>(txRepo);
    return operation(txService);
  });
}
```

This method creates a transactional service instance and executes the provided operation within a transaction.

## How to Use Transactions

### Basic Usage

```typescript
// Example: Update an entity within a transaction
await userService.withTransaction(async (txService) => {
	return txService.update(userId, userData);
});
```

### Complex Operations

For operations that involve multiple entities:

```typescript
// Example: Update a user and their profile in a single transaction
await userService.withTransaction(async (txUserService) => {
	// Update the user
	const updatedUser = await txUserService.update(userId, userData);

	// Get a transactional profile service
	const txProfileService = await profileService.withTransaction(async (s) => Promise.resolve(s));

	// Update the profile
	const updatedProfile = await txProfileService.update(profileId, profileData);

	return { user: updatedUser, profile: updatedProfile };
});
```

### Pre-built Transaction Methods

The `BaseService` class includes several pre-built transaction methods:

1. `updateWithTransaction(id, input)`: Updates an entity within a transaction
2. `updateMultipleEntities(updates)`: Updates multiple entities in a single transaction
3. `createWithRelatedOperations(input, relatedOperation)`: Creates an entity and performs related operations

## Best Practices

1. **Keep Transactions Short**: Long-running transactions can lead to performance issues and deadlocks
2. **Handle Errors Properly**: Ensure errors are caught and handled appropriately
3. **Avoid Nested Transactions**: While technically supported, nested transactions can be complex to manage
4. **Use Transactions Only When Necessary**: Not all operations require transactions

## Examples

See `src/lib/server/examples/transaction-example.ts` for complete examples of using transactions in real-world scenarios:

1. Updating a user and their profile in a single transaction
2. Creating a user with a profile in a single transaction
3. Transferring credits between users in a single transaction

## Troubleshooting

### Common Issues

1. **Transaction Timeout**: If a transaction takes too long, it may time out. Consider breaking it into smaller transactions.
2. **Deadlocks**: If multiple transactions are waiting for each other, a deadlock may occur. Ensure consistent ordering of operations.
3. **Connection Pool Exhaustion**: If too many transactions are open simultaneously, the connection pool may be exhausted. Monitor connection usage.

### Debugging

To debug transaction issues, you can add logging to the `withTransaction` function:

```typescript
export async function withTransaction<T>(callback: (tx: typeof db) => Promise<T>): Promise<T> {
	console.log('Starting transaction');
	try {
		const result = await client.transaction(async (txClient) => {
			const txDb = drizzle(txClient, { schema });
			return callback(txDb);
		});
		console.log('Transaction committed successfully');
		return result;
	} catch (error) {
		console.error('Transaction rolled back:', error);
		throw error;
	}
}
```
