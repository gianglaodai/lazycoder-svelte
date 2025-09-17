import { pgTable, text, integer, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { citext } from '../extensions';

// User role enum
export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN']);

// Users table - updated for Lucia compatibility
export const users = pgTable('users', {
	id: text('id').primaryKey(), // Changed to text for Lucia compatibility
	uid: uuid('uid').notNull().unique(),
	version: integer('version').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	username: citext('username').notNull().unique(),
	email: citext('email').notNull().unique(),
	role: userRoleEnum('role').notNull().default('USER')
	// Password is now handled by Lucia keys table
});

// Export types
export type UserOrm = typeof users.$inferSelect;
