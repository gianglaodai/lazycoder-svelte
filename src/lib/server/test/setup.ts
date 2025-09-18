/**
 * Test environment setup script
 *
 * This script is used to set up the test environment before running tests.
 * It ensures the test database is properly configured and accessible.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { testDb } from '../db/test-db';

const execAsync = promisify(exec);

/**
 * Checks if Docker is running
 */
async function checkDockerRunning(): Promise<boolean> {
	try {
		await execAsync('docker info');
		return true;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (error) {
		console.error('Docker is not running. Please start Docker and try again.');
		return false;
	}
}

/**
 * Starts the test database Docker container
 */
async function startTestDatabase(): Promise<void> {
	try {
		console.log('Starting test database container...');
		await execAsync('docker-compose up -d postgres-test');

		// Wait for the database to be ready
		console.log('Waiting for test database to be ready...');
		let retries = 10;
		while (retries > 0) {
			try {
				await testDb.execute('SELECT 1');
				console.log('Test database is ready!');
				return;
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
			} catch (error) {
				retries--;
				if (retries === 0) {
					throw new Error('Failed to connect to test database after multiple attempts');
				}
				console.log(`Retrying connection... (${retries} attempts left)`);
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}
	} catch (error) {
		console.error('Failed to start test database:', error);
		throw error;
	}
}

/**
 * Sets up the test database schema
 */
async function setupTestSchema(): Promise<void> {
	try {
		console.log('Setting up test database schema...');

		// Create post_types table if it doesn't exist
		await testDb.execute(`
      CREATE TABLE IF NOT EXISTS post_types (
        id SERIAL PRIMARY KEY,
        uid UUID NOT NULL UNIQUE,
        version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL
      );
    `);

		// Add more tables as needed

		console.log('Test database schema setup complete!');
	} catch (error) {
		console.error('Failed to set up test database schema:', error);
		throw error;
	}
}

/**
 * Main setup function
 */
export async function setupTestEnvironment(): Promise<void> {
	console.log('Setting up test environment...');

	// Check if Docker is running
	const dockerRunning = await checkDockerRunning();
	if (!dockerRunning) {
		throw new Error('Docker is required for running tests');
	}

	// Start test database
	await startTestDatabase();

	// Set up test schema
	await setupTestSchema();

	console.log('Test environment setup complete!');
}

// Run setup if this script is executed directly
if (require.main === module) {
	setupTestEnvironment()
		.then(() => {
			console.log('Test environment is ready!');
			process.exit(0);
		})
		.catch((error) => {
			console.error('Failed to set up test environment:', error);
			process.exit(1);
		});
}
