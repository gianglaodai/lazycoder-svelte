import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

// Session table for Lucia authentication
export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

// Key table for Lucia authentication (for OAuth providers, etc.)
export const keys = pgTable('keys', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	hashedPassword: text('hashed_password')
});

// Export types
export type SessionOrm = typeof sessions.$inferSelect;
export type KeyOrm = typeof keys.$inferSelect;
