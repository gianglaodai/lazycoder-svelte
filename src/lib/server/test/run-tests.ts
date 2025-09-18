/**
 * Test runner script
 *
 * This script sets up the test environment and runs the tests.
 * It ensures the test database is properly configured before running tests.
 */

import { spawn } from 'child_process';
import { setupTestEnvironment } from './setup';

/**
 * Runs the tests using Bun test
 */
async function runTests(): Promise<void> {
	return new Promise((resolve, reject) => {
		console.log('Running tests...');

		// Run tests using Bun
		const testProcess = spawn(
			'bun',
			['test', 'src/lib/server/repository/postType.repository.test.ts'],
			{
				stdio: 'inherit',
				shell: true
			}
		);

		testProcess.on('close', (code) => {
			if (code === 0) {
				console.log('Tests completed successfully!');
				resolve();
			} else {
				console.error(`Tests failed with exit code ${code}`);
				reject(new Error(`Tests failed with exit code ${code}`));
			}
		});

		testProcess.on('error', (error) => {
			console.error('Failed to run tests:', error);
			reject(error);
		});
	});
}

/**
 * Main function
 */
async function main(): Promise<void> {
	try {
		// Set up the test environment
		await setupTestEnvironment();

		// Run the tests
		await runTests();

		console.log('All done!');
		process.exit(0);
	} catch (error) {
		console.error('Error:', error);
		process.exit(1);
	}
}

// Run the script
if (require.main === module) {
	main();
}
