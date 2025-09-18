# Repository Testing with Docker

This directory contains the setup for testing repositories with a local test database using Docker.

## Overview

The testing setup includes:

1. A Docker Compose configuration for a PostgreSQL test database
2. A test database configuration that mirrors the production database
3. Test utilities for setting up the test environment
4. Repository tests that run against the test database

## Requirements

- Docker installed and running
- Bun.js for running tests

## Test Database

The test database runs in a Docker container with the following configuration:

- PostgreSQL 16
- Port: 5433 (to avoid conflicts with any existing PostgreSQL instances)
- Database name: lazycoder_test
- Username: postgres
- Password: postgres

## Running Tests

To run the repository tests with the test database:

```bash
bun run test:repo
```

This command will:

1. Start the Docker container with the test database if it's not already running
2. Set up the necessary database schema
3. Run the repository tests against the test database

## Test Structure

Each repository test file follows this structure:

1. Import the repository and test utilities
2. Define test fixtures
3. Set up and tear down the test environment
4. Override the repository's database connection to use the test database
5. Run tests within transactions to ensure isolation
6. Clean up after tests

## Adding New Repository Tests

To add tests for a new repository:

1. Create a new test file named `[repository-name].test.ts`
2. Import the test utilities from `../db/test-db`
3. Override the repository's `getDb` method to use the test database
4. Write tests that run within transactions using `withTestTransaction`
5. Add the test file path to the `run-tests.ts` script if needed

## Example

```typescript
import { test, expect } from 'bun:test';
import { yourRepository } from './your.repository';
import { testDb, withTestTransaction } from '../db/test-db';

// Override the repository's database connection
const originalGetDb = yourRepository.getDb;
function setupTestDb() {
	yourRepository.getDb = () => testDb;
	return () => {
		yourRepository.getDb = originalGetDb;
	};
}

test('your test', async () => {
	const cleanup = setupTestDb();

	try {
		await withTestTransaction(async () => {
			// Your test code here
		});
	} finally {
		cleanup();
	}
});
```

## Troubleshooting

If you encounter issues with the test database:

1. Make sure Docker is running
2. Check if the test database container is running with `docker ps`
3. If needed, restart the container with `docker-compose restart postgres-test`
4. Check the container logs with `docker-compose logs postgres-test`
