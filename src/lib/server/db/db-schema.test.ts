import { test, expect } from 'bun:test';
import { users } from './schema/index';

// This test only verifies that schema imports compile and that a table definition exists.
// It avoids importing the database or environment-specific modules.

test('schema users table should be defined', () => {
	// Drizzle table objects are functions/objects; we just ensure import worked.
	expect(users).toBeDefined();
});
