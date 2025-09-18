# Service and Repository Implementation Guidelines

This document provides guidelines for implementing services and repositories in the application. It covers the architecture, patterns, and best practices for creating new services and repositories.

## Architecture Overview

The application follows a layered architecture with the following components:

1. **Service Layer**: Business logic and operations
2. **Repository Layer**: Data access and persistence
3. **Database Layer**: Connection and transaction management

### Key Components

- **Entity**: Domain objects with business logic
- **Repository**: Data access objects for CRUD operations
- **Service**: Business logic and orchestration
- **Transaction**: Mechanism for ensuring data consistency

## Repository Implementation

Repositories handle data access and persistence. They provide a clean API for CRUD operations and hide the details of the database implementation.

### Creating a New Repository

1. Create a new file in `src/lib/server/repository/` named `[entityName].repository.ts`
2. Define the entity mapping function
3. Extend the `BaseDrizzleRepository` class
4. Implement any custom methods

### Example Repository Implementation

```typescript
import { entityTable } from '$lib/server/db/schema/entityTable';
import type { EntityOrm } from '$lib/server/db/schema/entityTable';
import type { Entity, EntityCreate } from '$lib/server/service/entity.service';
import { BaseDrizzleRepository } from '$lib/server/repository/base';
import { Transactional } from '$lib/server/service/transaction';
import { eq } from 'drizzle-orm';

// Entity mapping function
function toEntity(row: EntityOrm): Entity {
	return {
		id: row.id,
		uid: row.uid,
		version: row.version,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		// Add entity-specific properties
		name: row.name,
		description: row.description
	};
}

class EntityRepository extends BaseDrizzleRepository<Entity, EntityCreate> {
	constructor() {
		super({
			table: entityTable,
			toEntity,
			// Define how to map create input to database columns
			mapCreate: ({ name, description }) => ({ name, description }),
			// Define how to map update input to database columns
			mapUpdate: (entity: Entity) => ({ ...entity }),
			// Reference columns from the table
			idCol: entityTable.id,
			uidCol: entityTable.uid,
			versionCol: entityTable.version,
			updatedAtCol: entityTable.updatedAt
		});
	}

	// Add custom methods as needed
	@Transactional
	async findByName(name: string): Promise<Entity | null> {
		const rows = await this.getDb()
			.select()
			.from(this.table)
			.where(eq(entityTable.name, name))
			.limit(1);
		return rows[0] ? toEntity(rows[0] as EntityOrm) : null;
	}
}

// Export a singleton instance
export const entityRepository = new EntityRepository();
```

## Service Implementation

Services encapsulate business logic and orchestrate operations across multiple repositories. They provide a clean API for the application to use.

### Creating a New Service

1. Create a new file in `src/lib/server/service/` named `[entityName].service.ts`
2. Define the entity and create input types
3. Extend the `BaseService` class
4. Implement any custom methods

### Example Service Implementation

```typescript
import { BaseService } from '$lib/server/service/base';
import type { CreateFor } from '$lib/server/repository/base';
import type { Entity } from '$lib/server/service/base';
import { entityRepository } from '$lib/server/repository/entity.repository';
import { Transactional } from '$lib/server/service/transaction';
import { NotFoundError } from '$lib/server/service/error';

// Entity type
export interface Entity extends Entity {
	name: string;
	description: string;
}

// Create input type
export interface EntityCreate extends CreateFor<Entity> {
	name: string;
	description: string;
}

class EntityService extends BaseService<Entity, EntityCreate> {
	constructor() {
		super(entityRepository);
	}

	// Add custom methods as needed
	@Transactional
	async findByName(name: string): Promise<Entity> {
		const entity = await (this.repo as typeof entityRepository).findByName(name);
		if (!entity) throw new NotFoundError();
		return entity;
	}

	@Transactional
	async createWithRelatedData(input: EntityCreate, relatedData: any): Promise<Entity> {
		return this.createWithRelatedOperations(input, async (entity) => {
			// Perform related operations here
			await relatedRepository.insert({
				entityId: entity.id,
				...relatedData
			});
		});
	}
}

// Export a singleton instance
export const entityService = new EntityService();
```

## Transaction Management

Transactions ensure data consistency across multiple operations. The application provides a clean transaction API that is easy to use.

### Using Transactions

1. Use the `@Transactional` decorator on methods that need transaction support
2. For complex operations, use the `withTransaction` method

### Transaction Examples

#### Basic Transaction

```typescript
// Method with transaction support
@Transactional
async updateEntity(id: number, data: EntityUpdate): Promise<Entity> {
  const entity = await this.getById(id);
  // Update entity
  return this.repo.update({ ...entity, ...data });
}
```

#### Complex Transaction

```typescript
// Complex operation with multiple repositories
async updateEntityWithRelations(id: number, data: EntityUpdate, relatedData: RelatedData): Promise<Entity> {
  return this.withTransaction(async (txService) => {
    // Update entity
    const entity = await txService.update(id, data);

    // Get related service with same transaction
    const txRelatedService = await relatedService.withTransaction(s => Promise.resolve(s));

    // Update related data
    await txRelatedService.updateByEntityId(id, relatedData);

    return entity;
  });
}
```

## Best Practices

1. **Use the Base Classes**: Extend `BaseService` and `BaseDrizzleRepository` for consistent implementation
2. **Transaction Management**: Use `@Transactional` decorator for methods that need transaction support
3. **Error Handling**: Use the provided error classes (`NotFoundError`, `ConflictError`, etc.)
4. **Testing**: Write tests for repositories and services
5. **Validation**: Validate input data before passing it to repositories
6. **Separation of Concerns**: Keep business logic in services and data access in repositories
7. **Consistent Naming**: Follow the naming conventions for files and classes

## Testing

Testing is essential for ensuring the reliability of services and repositories. The application provides a test framework for writing tests.

### Testing Repositories

1. Use the test database for repository tests
2. Use transactions to isolate tests
3. Clean up after each test

### Example Repository Test

```typescript
import { test, expect } from 'bun:test';
import { entityRepository } from './entity.repository';
import { testDb, withTestTransaction, closeTestDb } from '../db/test-db';

// Test fixtures
const testEntities = [
	{
		name: 'Test Entity 1',
		description: 'Description 1'
	},
	{
		name: 'Test Entity 2',
		description: 'Description 2'
	}
];

// Setup and teardown
beforeAll(async () => {
	// Set up test database
});

afterAll(async () => {
	// Clean up and close connection
	await closeTestDb();
});

// Tests
test('insert should create a new entity', async () => {
	await withTestTransaction(async () => {
		// Override the getDb method to use the test database
		entityRepository.getDb = () => testDb;

		const entity = await entityRepository.insert(testEntities[0]);

		expect(entity).toBeDefined();
		expect(entity.name).toBe(testEntities[0].name);
		expect(entity.id).toBeGreaterThan(0);
	});
});
```

## Conclusion

Following these guidelines will ensure a consistent and maintainable implementation of services and repositories in the application. The architecture provides a clean separation of concerns and a solid foundation for building robust applications.
