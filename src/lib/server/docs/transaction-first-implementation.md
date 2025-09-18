# Transaction-First Implementation

This document explains the new transaction-first implementation in the application, which ensures that all service and repository methods automatically use transactions without requiring explicit transaction handling.

## Overview

The transaction-first implementation provides the following benefits:

1. **Automatic Transactions**: All service and repository methods automatically run within transactions
2. **Simplified Code**: No need for explicit transaction handling in most cases
3. **Consistent Behavior**: All operations follow the same transaction pattern
4. **Better Error Handling**: Automatic rollback on errors
5. **Improved Data Integrity**: All related operations either succeed or fail together

## Implementation Details

### Database Layer (`src/lib/server/db/index.ts`)

The database layer provides the foundation for the transaction-first implementation:

```typescript
// Transaction context for tracking active transactions
const transactionContext = {
  current: null as any
};

// Get the current database instance (transaction or default)
export function getCurrentDb(): typeof db {
  return transactionContext.current || db;
}

// Execute a callback within a transaction
export async function withTransaction<T>(callback: (tx: typeof db) => Promise<T>): Promise<T> {
  // If already in a transaction, reuse it
  if (transactionContext.current) {
    return callback(transactionContext.current);
  }

  // Otherwise, create a new transaction
  return client.transaction(async (txClient) => {
    const txDb = drizzle(txClient, { schema });
    
    // Set the current transaction
    const previousTx = transactionContext.current;
    transactionContext.current = txDb;
    
    try {
      // Execute the callback
      const result = await callback(txDb);
      return result;
    } finally {
      // Restore the previous transaction context
      transactionContext.current = previousTx;
    }
  });
}

// Decorator for adding transaction support to methods
export function Transactional(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function(...args: any[]) {
    return withTransaction(async () => {
      return originalMethod.apply(this, args);
    });
  };
  
  return descriptor;
}
```

### Repository Layer (`src/lib/server/repository/base.ts`)

The repository layer uses the `getCurrentDb()` function and `@Transactional` decorator:

```typescript
export class BaseDrizzleRepository<T extends Entity, C extends CreateFor<T>>
  implements Repository<T, C>
{
  // ...

  // Get the current database instance (transaction or default)
  protected getDb() {
    return getCurrentDb();
  }

  // All methods are decorated with @Transactional
  @Transactional
  async findById(id: number): Promise<T | null> {
    const rows = await this.getDb().select().from(this.table).where(eq(this.idCol, id)).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  // Other methods...
}
```

### Service Layer (`src/lib/server/service/base.ts`)

The service layer also uses the `@Transactional` decorator:

```typescript
export class BaseService<T extends Entity, C extends CreateFor<T>> {
  // ...

  // All methods are decorated with @Transactional
  @Transactional
  async getById(id: number): Promise<T> {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundError();
    return item;
  }

  // Other methods...
}
```

## How to Use

### Basic Usage

With the transaction-first implementation, you don't need to do anything special to use transactions. All service and repository methods automatically run within transactions:

```typescript
// This automatically runs in a transaction
const postType = await postTypeService.getById(1);

// This also automatically runs in a transaction
const updatedPostType = await postTypeService.update(1, {
  ...postType,
  name: 'New Name'
});
```

### Complex Operations

For complex operations that involve multiple steps, you can create a new method and decorate it with `@Transactional`:

```typescript
import { Transactional } from '$lib/server/db';

// This entire method runs in a single transaction
@Transactional
async function complexOperation() {
  const postType = await postTypeService.getById(1);
  
  const updatedPostType = await postTypeService.update(1, {
    ...postType,
    name: 'New Name'
  });
  
  const newPostType = await postTypeService.create({
    code: 'new-code',
    name: 'New Post Type'
  });
  
  return { updatedPostType, newPostType };
}
```

### Custom Repositories

When creating custom repository methods, use the `getDb()` method and decorate the method with `@Transactional`:

```typescript
import { Transactional } from '$lib/server/db';

class CustomRepository extends BaseDrizzleRepository<CustomEntity, CustomCreate> {
  // ...

  @Transactional
  async customMethod(param: string): Promise<CustomEntity | null> {
    const rows = await this.getDb().select().from(this.table).where(eq(this.customCol, param)).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }
}
```

### Custom Services

When creating custom service methods, decorate the method with `@Transactional`:

```typescript
import { Transactional } from '$lib/server/db';

class CustomService extends BaseService<CustomEntity, CustomCreate> {
  // ...

  @Transactional
  async customMethod(param: string): Promise<CustomEntity> {
    // This runs in a transaction
    const entity = await this.repo.customMethod(param);
    if (!entity) throw new NotFoundError();
    return entity;
  }
}
```

## Examples

See `src/lib/server/examples/transaction-first-example.ts` for complete examples of using the transaction-first implementation.

## Best Practices

1. **Use the `@Transactional` Decorator**: Always decorate custom methods with `@Transactional`
2. **Use `getDb()` in Repositories**: Always use `this.getDb()` instead of direct database access
3. **Keep Transactions Short**: Long-running transactions can lead to performance issues
4. **Handle Errors Properly**: Ensure errors are caught and handled appropriately
5. **Test Transaction Behavior**: Verify that transactions work as expected in your tests

## Troubleshooting

### Common Issues

1. **Transaction Not Working**: Make sure you're using `this.getDb()` in repositories and `@Transactional` on methods
2. **Transaction Timeout**: If a transaction takes too long, it may time out
3. **Deadlocks**: If multiple transactions are waiting for each other, a deadlock may occur

### Debugging

To debug transaction issues, you can add logging to the `withTransaction` function:

```typescript
export async function withTransaction<T>(callback: (tx: typeof db) => Promise<T>): Promise<T> {
  console.log('Starting transaction');
  
  // If already in a transaction, reuse it
  if (transactionContext.current) {
    console.log('Reusing existing transaction');
    return callback(transactionContext.current);
  }

  // Otherwise, create a new transaction
  console.log('Creating new transaction');
  return client.transaction(async (txClient) => {
    const txDb = drizzle(txClient, { schema });
    
    // Set the current transaction
    const previousTx = transactionContext.current;
    transactionContext.current = txDb;
    
    try {
      // Execute the callback
      console.log('Executing transaction callback');
      const result = await callback(txDb);
      console.log('Transaction successful');
      return result;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    } finally {
      // Restore the previous transaction context
      console.log('Restoring previous transaction context');
      transactionContext.current = previousTx;
    }
  });
}
```